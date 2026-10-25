import { expect } from "@playwright/test";

// Mailpit, the mail catcher of the local Supabase (supabase/config.toml, [local_smtp]).
const mailpit = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

type MessageSummary = { ID: string; Subject: string };

// A fresh address per test, so the nine browser projects never share an account.
export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function messagesTo(email: string): Promise<MessageSummary[]> {
  const query = encodeURIComponent(`to:"${email}"`);
  const response = await fetch(`${mailpit}/api/v1/search?query=${query}`);
  const { messages } = (await response.json()) as { messages: MessageSummary[] };
  return messages;
}

// Waits for the count-th e-mail to an address and returns its subject and verification link.
export async function verificationEmail(email: string, count = 1) {
  let messages: MessageSummary[] = [];
  await expect
    .poll(async () => (messages = await messagesTo(email)).length, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(count);

  // Mailpit lists the newest first.
  const latest = messages[0] as MessageSummary;
  const response = await fetch(`${mailpit}/api/v1/message/${latest.ID}`);
  const { HTML } = (await response.json()) as { HTML: string };
  const href = /href="([^"]*token_hash=[^"]*)"/.exec(HTML)?.[1];
  if (!href) throw new Error(`No verification link in the e-mail to ${email}`);
  return { subject: latest.Subject, link: href.replaceAll("&amp;", "&") };
}
