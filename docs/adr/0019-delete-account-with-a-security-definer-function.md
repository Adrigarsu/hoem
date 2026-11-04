# ADR-019 Delete an account through a security definer function

Date: 2026-11-03 · Status: Accepted

## Context

Users delete their own account (FR-ACC-007, NFR-LEG-003, GDPR art. 17). That means removing the
`auth.users` row, which Supabase documents through its admin API and the service-role key. ADR-004
forbids that key while handling a request. The cascades from `auth.users` and the trigger
`private.ensure_household_keeps_owner` already delete what belongs to the account and refuse the last
owner of a household with other members.

## Decision

We will delete the row in SQL, with `private.delete_own_account(confirmation)`, a `security definer`
function outside the Data API, called through the `security invoker` wrapper
`public.delete_own_account` with the user's own JWT.

- It takes no user id, so it can only delete `auth.uid()`.
- It compares the typed e-mail with `auth.users.email`, as the service does. This prevents accidents,
  not attacks: the e-mail is no secret, so someone holding an open session could type it.
- It refuses while files remain in the user's avatar folder, so a direct call to the Data API cannot
  leave a photo behind.
- Refusals carry stable codes in the HINT: `not_authenticated`, `wrong_confirmation`, `files_left`,
  and `last_owner`, which the trigger itself raises, so no other error can be mistaken for it.

The service checks the e-mail and the last-owner rule first, so a refusal deletes nothing. It then
removes the user's avatar files through the Storage API, because Supabase refuses a direct delete on
`storage.objects`, and only then calls the function. If removing them fails, the account stays and the
user can retry. Doing it afterwards could leave the photo of a deleted account with nobody able to
remove it.

As ADR-009 says, deleting an account asks for typed confirmation and has no undo.

## Consequences

- No secret enters the request path, and the deletion and the last-owner check are one transaction.
- A failure between removing the photos and deleting the account leaves the account without a photo,
  and the Avatar shows the initials.
- Any table with private records must delete them with the account, since a single foreign key cannot
  delete private rows and keep shared ones. Each such table needs a pgTAP test of that.
- Foreign keys do not reach Storage. Any bucket with files of a household or a user, such as recipe
  photos, must have them removed when the account or its household goes.
- Accounts without an e-mail, such as demo sessions (ADR-011), cannot pass the confirmation. The demo
  decides what they do when it is built; its cleanup job removes them meanwhile.
- Deleting the row bypasses GoTrue, so it depends on the `postgres` role being able to delete from
  `auth.users`. pgTAP fails if a Supabase upgrade removes that.
- Access tokens already issued stay valid until they expire (one hour by default). They read nothing,
  because the memberships and the profile are gone, and `avatars_insert_own` needs a profile, so they
  cannot store a new photo either. Other devices show an error until they expire.
- `auth.audit_log_entries` is not touched, as the admin API does not touch it either. Whether it holds
  the e-mail in production is checked on staging.

Rejected:

- An Edge Function with the admin API puts the service-role key back in the request path, in another
  process, and cannot share a transaction with the last-owner check.
- A queue processed by a scheduled job respects ADR-004, but deletion stops being immediate, against
  the issue's acceptance criteria, and that job infrastructure does not exist yet.
