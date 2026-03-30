# White-Label Bail Agency Platform

This repo is a white-label, config-driven bail agency platform using static HTML + vanilla JavaScript modules. One shared codebase can serve multiple branded agencies by selecting an agency slug and preparing that agency's manifest, icons, and theme tokens before deployment.

## Stack

- Static multi-page HTML + ES module JavaScript (no required build step for local runtime)
- Shared CSS token system
- Optional Supabase client integration
- Static PWA manifest generation

## Project Structure

```text
/src
  /assets/branding/{agency}/
  /config/agencies/
  /theme/
  /types/
  /lib/
  /components/
  /pages/

/public
  /icons/agencies/{agency}/
  /icons/current/
  manifest.json

/scripts
  generate-manifest.mjs
  validate-agency-config.mjs
  prepare-branding.mjs

/supabase
  /migrations
  /policies
```

## Supported Agencies

- `angelic`
- `shadowpoint`
- `template`

## Environment Variables

Copy `.env.example` to `.env` and set values for your local agency target.

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_AGENCY_SLUG=angelic
VITE_APP_ENV=local
VITE_SUPPORT_EMAIL=support@example.com
```

## Local Run

1. Optional: set runtime agency env values in `window.__APP_ENV__` (or `.env` if you also run script tooling).
2. Serve statically from repo root:

```bash
python -m http.server
```

3. Open:

- `http://localhost:8000/login.html`

## Adding A New Agency

1. Copy [template.js](/c:/Users/Kyarb/AngelicConnect/src/config/agencies/template.js) to a new config in `src/config/agencies/`.
2. Add branding source files to `src/assets/branding/{agency}/`.
3. Add public icon files to `public/icons/agencies/{agency}/`.
4. Register the new config in [index.js](/c:/Users/Kyarb/AngelicConnect/src/config/agencies/index.js).
5. Run:

```bash
npm run validate:agencies
npm run prepare:branding
```

## Agency Config System

Each agency config covers:

- agency id and slug
- app name, short name, company name
- contact info
- branding asset directory and icon directory
- theme colors
- feature flags
- check-in rules
- legal disclaimer
- manifest colors and description

Shared runtime loading is handled in [agency.js](/c:/Users/Kyarb/AngelicConnect/src/lib/agency.js). Theme tokens are built in [buildTheme.js](/c:/Users/Kyarb/AngelicConnect/src/theme/buildTheme.js) and applied in [applyTheme.js](/c:/Users/Kyarb/AngelicConnect/src/theme/applyTheme.js).

## Manifest / Icon Workflow

- [validate-agency-config.mjs](/c:/Users/Kyarb/AngelicConnect/scripts/validate-agency-config.mjs): validates all agency configs
- [generate-manifest.mjs](/c:/Users/Kyarb/AngelicConnect/scripts/generate-manifest.mjs): writes `public/manifest.json` for the selected agency
- [prepare-branding.mjs](/c:/Users/Kyarb/AngelicConnect/scripts/prepare-branding.mjs): copies selected agency icons into `public/icons/current/` and regenerates the manifest

Use `npm run prepare:branding` before `npm run dev` or `npm run build` for the agency you want to ship.

## Deployment Notes

To deploy a branded version:

1. Set agency/runtime values for the environment (`VITE_AGENCY_SLUG`, `VITE_SUPPORT_EMAIL`, etc.).
2. Run `npm run prepare:branding` if you want to regenerate `public/icons/current/` + `public/manifest.json`.
3. Deploy the static repo output (or your selected static export target) and serve over HTTPS.

Each deployment should use one agency slug at a time so the generated manifest/icons match the chosen brand.

## Supabase Multi-Agency Readiness

Current status:

- Frontend seed data is agency-aware (`agency_id` on agency-owned seeded records).
- Agency selection is environment-driven.
- Supabase integration remains optional.
- Query-level agency filtering is enabled through agency config (`enforceAgencyScopeInQueries: true`).
- Check-in writes include `agency_id`, capture metadata, and create agency-scoped activity entries.
- `activity_logs` table support is wired in client read mapping.
- Optional Supabase Storage selfie path scaffold exists (feature-flagged).

Schema / migration files:

- [schema.sql](/c:/Users/Kyarb/AngelicConnect/schema.sql)
- [20260329_multi_agency_scaffold.sql](/c:/Users/Kyarb/AngelicConnect/supabase/migrations/20260329_multi_agency_scaffold.sql)
- [20260329_multi_agency_hardening.sql](/c:/Users/Kyarb/AngelicConnect/supabase/migrations/20260329_multi_agency_hardening.sql)
- [agency_rls.sql](/c:/Users/Kyarb/AngelicConnect/supabase/policies/agency_rls.sql)

Manual Supabase steps still required:

1. Apply migration files in order.
2. Backfill `agency_id` for legacy rows.
3. Set `agency_id` columns to `NOT NULL` where backfill is complete.
4. Add `agency_id` / `app_role` (and optionally `defendant_id`) claims to JWT/session context.
5. Run policy script and validate access by role + agency.
6. Create and secure the `checkin-selfies` storage bucket before enabling `enableSupabaseSelfieStorage`.

Security / scaling notes:

- RLS policies are prepared but still depend on real JWT claim wiring.
- Admin write flows outside `submitCheckIn` are still local-first and need dedicated Supabase mutation handlers before production multi-tenant launch.
- Check-in selfies still store `selfie_data_url` inline for compatibility; this is not ideal at scale. Use `enableSupabaseSelfieStorage` once storage bucket/policies are configured.
