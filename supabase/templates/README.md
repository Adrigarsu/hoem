# Auth e-mail templates

Supabase Auth sends these files as they are, so they hold no comments: the notes live here.
Staging and production use the same files, pasted in the dashboard (Authentication → Email
Templates); `supabase/config.toml` points the local stack at them.

- `confirmation.html`: sign-up confirmation (FR-ACC-001). The link goes to `/auth/confirm` on the
  site that asked for it (`emailRedirectTo`, checked against the Redirect URLs allow-list), which
  verifies the token and signs the user in.
- `recovery.html`: password reset (FR-ACC-008). The link goes to `/auth/reset-password` on the site
  that asked for it (`redirectTo`), where the token is verified only when the new password is sent.

Colours are the light-theme tokens (`bg`, `surface`, `text`, `text-secondary`, `brand`,
`on-brand`) written as hex values: e-mail clients do not support CSS variables.

## Inbox placement (#54)

SPF, DKIM and DMARC pass in Outlook (`compauth=pass`), yet Outlook files the e-mails as junk while
Gmail delivers them to the inbox: a new domain with little sending history. Revisit before the MVP
release (M7); if Outlook still files them as junk, send them through a Supabase Send Email Hook
with an HTML and a plain-text part.
