# White-Label Bail Agency Platform

This repo is now a white-label, config-driven bail agency platform built on Vite + vanilla JavaScript. One shared codebase can serve multiple branded agencies by selecting an agency slug and preparing that agency's manifest, icons, and theme tokens before deployment.

## Stack

- Vite multi-page app
- Vanilla JavaScript modules
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

1. Install dependencies:

```bash
npm install
```

2. Pick an agency:

```bash
set VITE_AGENCY_SLUG=angelic
```

3. Prepare branding assets and manifest for that agency:

```bash
npm run prepare:branding
```

4. Start Vite:

```bash
npm run dev
```

5. Open:

- `http://localhost:5173/login.html`

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

1. Set `VITE_AGENCY_SLUG`
2. Set `VITE_SUPPORT_EMAIL`
3. Run `npm run prepare:branding`
4. Run `npm run build`
5. Deploy the built output

Each deployment should use one agency slug at a time so the generated `manifest.json` and `public/icons/current/` match the chosen brand.

## Supabase Multi-Agency Readiness

Current status:

- Frontend seed data is agency-aware
- Agency selection is environment-driven
- Supabase integration remains optional
- Query-level agency filtering is scaffolded behind a feature flag and disabled by default to avoid breaking older schemas

Scaffolding added:

- [20260329_multi_agency_scaffold.sql](/c:/Users/Kyarb/AngelicConnect/supabase/migrations/20260329_multi_agency_scaffold.sql)
- [agency_rls.sql](/c:/Users/Kyarb/AngelicConnect/supabase/policies/agency_rls.sql)

These files prepare `agency_id` columns and policy direction, but production-grade agency isolation still needs real auth claims and completed RLS wiring.
