# Deployment Guide (Vercel + Supabase)

This app deploys as a static site. No build step is required for runtime hosting.

## 1) Vercel Static Deployment

1. Push this repo to GitHub.
2. In Vercel, click **New Project** and import the repo.
3. Set:
   - Framework Preset: `Other`
   - Build Command: leave empty
   - Output Directory: leave empty
4. Deploy.

This repo includes [vercel.json](/c:/Users/Kyarb/AngelicConnect/vercel.json) to keep static behavior predictable:
- `/` redirects to `/login.html`
- `manifest.json` has short cache
- `service-worker.js` is no-cache

## 2) Supabase Connection Model (Current Architecture)

- Client initialization is in [supabase.js](/c:/Users/Kyarb/AngelicConnect/supabase.js).
- Current credentials are committed in that file (publishable key only).
- This is acceptable for publishable Supabase keys, but still requires strict RLS.

Important limitation for static hosting:
- Vercel environment variables are **not automatically injected** into static browser JS without a build/injection step.
- In the current architecture, agency/runtime settings are resolved from:
  - agency config files in `src/config/agencies/*`
  - optional `window.__APP_ENV__` values (if you inject them yourself)
  - fallback defaults in code

## 3) Agency Branding and Config for Deployment

Before each agency deploy:

1. Ensure the agency config exists in `src/config/agencies/`.
2. Ensure agency branding assets exist in:
   - `src/assets/branding/{agency}/`
   - `public/icons/agencies/{agency}/`
3. Run:
   - `npm run validate:agencies`
   - `npm run prepare:branding`
4. Confirm generated assets:
   - `/manifest.json`
   - `/icons/current/*`
5. Deploy that branded snapshot to Vercel.

Recommended operational model:
- One agency per branch/project deployment.
- Keep `VITE_AGENCY_SLUG` default and generated branding aligned to that branch's agency.

## 4) Domain and Subdomain Strategy

Standard setup (included in base service):
- Agency subdomain under your platform domain.
- Examples:
  - `angelic.yourplatformdomain.com`
  - `shadowpoint.yourplatformdomain.com`

Premium/custom-domain setup:
- Agency-owned domain or subdomain.
- Examples:
  - `app.clientagency.com`
  - `portal.clientagency.com`

Manual DNS steps outside repo:
1. Add domain/subdomain in Vercel Project Settings.
2. Add DNS record at the domain host (usually CNAME to Vercel target).
3. Wait for DNS propagation and SSL issuance.
4. Re-test manifest, service worker, and install prompt on the final domain.

## 5) Supabase Production Readiness Steps

1. Confirm `schema.sql` and migrations are applied in target Supabase project.
2. Backfill `agency_id` on all agency-owned rows.
3. Set `agency_id` to `NOT NULL` where backfill is complete.
4. Configure JWT claims (`agency_id`, `app_role`, `defendant_id`) for authenticated users.
5. Apply [agency_rls.sql](/c:/Users/Kyarb/AngelicConnect/supabase/policies/agency_rls.sql).
6. Validate admin and defendant behavior by role and agency.
7. If using selfie storage bucket:
   - create `checkin-selfies`
   - add storage access policies
   - then enable `enableSupabaseSelfieStorage`.

## 6) New Agency Launch Checklist

- Agency config added and validated.
- Phone/email/contact values verified.
- Branding assets and wordmark verified.
- App icons + favicon + apple-touch-icon verified.
- `manifest.json` regenerated and correct app name/colors confirmed.
- Supabase schema/migrations applied in target project.
- RLS policies applied and tested.
- Login works (admin + defendant).
- Defendant check-in flow works (camera selfie + submission).
- Admin dashboard/activity log renders correctly.
- Contact links (`tel:`) point to correct agency number.
- No broken asset paths in browser console/network.
