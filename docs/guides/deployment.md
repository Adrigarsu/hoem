# Deployment

Where HØEM runs and how a change reaches it. The reasons are in `docs/architecture.md` §9 and
ADR-013 and ADR-014.

## How a change reaches production

1. A pull request gets its own preview on a `*.vercel.app` URL, protected by Vercel
   Authentication, against the **staging** Supabase project.
2. Merging into `main` deploys to https://hoemapp.com. If the merge touches
   `supabase/migrations/`, `migrate.yml` applies the pending migrations to staging and then to
   production at the same time; production is skipped if staging fails. That is why a migration
   always merges before the code that uses it (`migrations.md`).
3. Check the deploy in Vercel and, after a migration, the `Migrate` run in GitHub Actions.

## Vercel

- Builds through its GitHub integration. Functions run in `fra1` (Frankfurt, set in
  `vercel.json`), the same EU region as Supabase.
- Holds `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` per environment, and
  `RESEND_API_KEY` as Sensitive. The service-role key is never set in Vercel; only background jobs
  use it.

## Supabase

- `hoem-staging` in Frankfurt (used by previews) and `hoem-production` in Ireland (ADR-013).
- Their connection strings live in the `supabase-staging` and `supabase-production` GitHub
  environments, which only `main` can use.
- Auth e-mail templates are pasted in each dashboard (Authentication → Email Templates) from
  `supabase/templates/`; its README says which settings go with them.
- **Keep-alive:** free projects pause after a week without activity, so `keep-alive.yml` calls
  `ping()` on both every three days. GitHub disables scheduled workflows after 60 days without
  commits; its failure e-mail is the signal to re-enable it.

## Domain and DNS

`hoemapp.com` is registered at Cloudflare, which hosts its DNS. The apex `A` record and the `www`
`CNAME` point to Vercel, and `www.hoemapp.com` redirects permanently (308) to `hoemapp.com`. Every
record for Vercel and Resend is "DNS only" (proxy off), so TLS certificates and caching stay with
Vercel and e-mail authentication is not altered.

## E-mail

- Resend (eu-west-1) sends from `no-reply@hoemapp.com` on a verified domain. Its records come from
  Resend's Cloudflare integration (MX and SPF on `send`, DKIM on `resend._domainkey`), plus a DMARC
  record on `_dmarc` that we add ourselves. DMARC reports go to Cloudflare DMARC Management.
- Resend is also the SMTP server of Supabase Auth on staging and production, so password-reset and
  confirmation e-mails come from the same address. Each environment has its own key, limited to
  sending from `hoemapp.com`.
- Locally, Auth e-mails land in Mailpit at http://127.0.0.1:54324.
- The VAPID contact for Web Push is `mailto:hello@hoemapp.com`.
