# Launch Checklist

Use this before every agency go-live.

## Branding and Configuration
- Agency config exists and passes validation.
- Correct app name/short name/company name set.
- Logo/wordmark/icon assets in correct folders.
- Theme colors reviewed for readability and contrast.
- Agency phone/email/address/hours verified.

## Contact and Compliance
- Support and emergency numbers tested.
- `tel:` links verified on mobile.
- Disclaimer/privacy text approved by agency.
- Any state-specific wording confirmed.

## PWA and Install Readiness
- `manifest.json` matches agency branding.
- `icons/current/*` reflects correct agency icon set.
- Favicon and apple-touch-icon render correctly.
- Service worker registers without console errors.
- Install prompt behavior tested on supported devices.

## Supabase and Data Readiness
- Schema/migrations applied in target Supabase project.
- `agency_id` backfill completed (if legacy data exists).
- RLS policy SQL applied and validated.
- JWT claims wired for `agency_id`, `app_role`, `defendant_id`.
- Storage bucket/policies configured if selfie storage is enabled.

## Functional Testing
- Login works for admin and defendant test users.
- Admin dashboard loads expected agency-only data.
- Defendant dashboard loads expected agency-only data.
- Live selfie check-in works end-to-end.
- Activity log and selfie preview behavior verified.
- Reminders/payments/court date sections render correctly.
- "Need help" contact action dials correct agency number.

## Release Safety
- No broken asset paths (network tab and console clean).
- No 404 for manifest/icons/core scripts.
- Critical pages tested:
  - `/login.html`
  - `/admin/index.html`
  - `/defendant/index.html`
  - `/marketing/landing.html`
- Legacy wrappers still resolve:
  - `/admin.html`
  - `/defendant.html`
  - `/landing.html`
- Rollback plan prepared (previous known-good deploy).
- Agency sign-off captured before public go-live.
