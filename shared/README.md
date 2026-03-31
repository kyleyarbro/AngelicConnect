# Shared Platform Layer

This folder documents the shared runtime layer used by both app surfaces.

## Shared Code Locations

- Agency + tenant resolution: `/src/lib/agency.js`
- API + Supabase data access: `/src/lib/api.js`
- Session and storage keys: `/src/lib/session.js`
- Brand rendering helpers: `/src/components/brand.js`
- Theme application: `/src/theme/applyTheme.js`, `/src/theme/buildTheme.js`
- Shared app styling: `/src/theme/base.css`
- Supabase browser bootstrap: `/supabase.js`

## Why this exists

The repo intentionally keeps one shared platform core while exposing separate app entry surfaces:

- `/admin/index.html`
- `/defendant/index.html`
- `/marketing/landing.html`
