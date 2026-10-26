import type { ZodError } from "zod";

type Issue = ZodError["issues"][number];

// The field an issue is about, as the form names its inputs ("split.userId"), or undefined for a
// rule about the whole input. String() because Zod paths may hold symbols.
export function issuePath(issue: Issue): string | undefined {
  return issue.path.length > 0 ? issue.path.map(String).join(".") : undefined;
}

// One message key per field (the first problem), for a form to show next to each input
// (NFR-SEC-002). The schema's messages are keys under the feature's validation messages. Rules
// about the whole input need a `path` in the schema to show up here.
export function formFieldErrors<Key extends string>(
  error: ZodError | undefined,
): Record<string, Key> {
  const errors: Record<string, Key> = {};
  for (const issue of error?.issues ?? []) {
    const field = issuePath(issue);
    if (field) errors[field] ??= issue.message as Key;
  }
  return errors;
}
