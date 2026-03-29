# Angelic Connect

Angelic Connect is a mobile-first operational platform for Angelic Bail Bonds with separate experiences for defendants and staff/admin users.

## File Tree

- `index.html`
- `login.html`
- `defendant.html`
- `admin.html`
- `styles.css`
- `brand.js`
- `app.js`
- `defendant.js`
- `admin.js`
- `supabase.js`
- `config.example.js`
- `config.js`
- `schema.sql`
- `README.md`

## Local Run (Static Server)

From project root:

```bash
cp config.example.js config.js
python3 -m http.server 8080
```

Open:

- `http://localhost:8080/login.html`

## Sample Login Credentials

### Defendant
- Email: `defendant@angelicbailbonds.com`
- Password: `Defendant@123`

### Staff/Admin
- Email: `admin@angelicbailbonds.com`
- Password: `Admin@123`

## Supabase Setup

1. Create a new Supabase project.
2. In Supabase SQL Editor, run `schema.sql`.
3. Copy project URL and anon key.
4. Edit `config.js`:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  useSupabaseAuth: true,
  useSupabaseData: true,
  brand: {
    companyName: "Angelic Bail Bonds",
    productName: "Angelic Connect",
    supportPhone: "+1 (919) 555-0142",
    supportEmail: "support@angelicbailbonds.com",
    theme: {
      primary: "#15304b",
      accent: "#c79a56",
      background: "#0f1621"
    }
  }
};
```

5. Ensure your Auth users exist in Supabase Auth and corresponding rows are present in `users` with matching role and `defendant_id` (for defendant accounts).
6. Keep `useSupabaseAuth` and `useSupabaseData` as `false` to run with built-in local seeded data.

## Branding / Theme System

Branding is centralized in `APP_CONFIG.brand` and applied by `brand.js`.

You can rebrand without rewriting components by changing:

- `companyName`
- `productName`
- `supportPhone`
- `supportSms`
- `emergencyPhone`
- `supportEmail`
- `officeAddress`
- `officeHours`
- `tagline`
- `statewideText`
- `reassuranceText`
- `supportLine`
- `logoText`
- `theme.primary`
- `theme.secondary`
- `theme.accent`
- `theme.background`
- `theme.surface`
- `theme.surfaceAlt`
- `theme.border`
- `theme.text`
- `theme.muted`
- `theme.success`
- `theme.warning`
- `theme.error`

## Data Model and Relationships

Tables included in `schema.sql`:

- `users`
- `defendants`
- `bonds`
- `court_dates`
- `payments`
- `check_ins`
- `location_logs`
- `reminders`
- `notes`

Key relationships:

- `users.defendant_id` -> `defendants.id`
- `defendants.user_id` -> `users.id`
- `bonds.defendant_id` -> `defendants.id`
- `court_dates.defendant_id` -> `defendants.id`
- `payments.defendant_id` -> `defendants.id`
- `check_ins.defendant_id` -> `defendants.id`
- `location_logs.defendant_id` -> `defendants.id`
- `location_logs.check_in_id` -> `check_ins.id`
- `reminders.defendant_id` -> `defendants.id`
- `notes.defendant_id` -> `defendants.id`

## Testing Workflow

### Defendant Side
1. Sign in as defendant.
2. Verify dashboard priorities: next court date, check-in, payment due, quick contact.
3. Open Check-In and tap **Check in now**.
4. Confirm check-in history updates and location is recorded or gracefully marked unavailable.
5. Review Court, Payments, Reminders, Contact, and Profile sections.

### Admin Side
1. Sign in as admin.
2. Verify operations dashboard metrics and recent activity.
3. Open Defendant List and use search/filters.
4. Open defendant details from the Defendant List and update court date, address, bond status, payment fields, active/inactive, missed check-in flag.
5. Add internal note and capture location snapshot from admin view.
6. Open Reminder Center to create and track reminders.

## Switching Local Seed Data to Supabase Data

- `supabase.js` contains a complete local seeded dataset for immediate local use.
- Once your Supabase tables contain live records, set `useSupabaseData: true` in `config.js`.
- Once Supabase Auth is configured, set `useSupabaseAuth: true` and use real credentials.
