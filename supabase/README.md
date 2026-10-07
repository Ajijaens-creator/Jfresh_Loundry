# JFRESH OS · Backend (Supabase)

Project: **Jfresh Laundry OS**, region Southeast Asia (Singapore), plan Pro.
The website stays on GitHub Pages (`main` → jfreshlaundry.app). This folder holds
the database: tables, access rules and reference data.

## How changes reach the live database

The Supabase GitHub integration watches this repository. When a pull request
that changes `supabase/migrations/` is merged into `main`, Supabase applies the
new migration files to the production database automatically. No secret key is
needed in the repository or in chat.

Rules:
- A migration that already ran is never edited. Every change is a new file.
- Reference data (plants, roles, permissions) is generated from the JS engines:
  `node tools/export-access-seed.js supabase/migrations/<timestamp>_access_reference_data.sql`.

## Step 1 · Access foundation (this folder today)

| Table | What it holds |
|---|---|
| `plants`, `clients`, `employees` | Organisation scope. Employee and login account are separate. |
| `profiles` | One row per login account (linked to Supabase Auth): status, lock, language, plant scope, full access. |
| `roles`, `permissions`, `role_permissions` | The 19 roles and 291 permissions of Phases 4–11. |
| `user_roles`, `user_plants`, `user_permission_denies` | Who has which role (one default), which plants, and per-user exceptions. |
| `audit_log` | Append-only security trail, written only through `log_event()`. |

Every table has row level security. A signed-out visitor reads nothing; a user
with no role, or a locked / inactive / suspended account, has no permission.
Admins with `sys.users` manage accounts but cannot change their own access, and
only a full-access user (the owner) can grant full access or the owner /
superadmin roles, or change the owner's account.

The app reads everything it needs after login with one call:
`supabase.rpc('my_access')` → roles, permissions, plants, landing screen.

## One-time setup (owner)

1. Authentication → Sign In / Providers → turn **off** "Allow new users to sign up".
2. Authentication → Users → **Add user** → your own email and a strong password.
3. SQL Editor → run once:
   ```sql
   select public.bootstrap_owner('your-email@example.com');
   ```
   This makes that account the owner with full access. It cannot be called from the app.

## Tests

`supabase/tests/access_rls_test.sql` checks 33 access rules (anonymous, owner,
operator, client, no role, locked, per-user deny, system admin limits). It runs
inside a transaction and rolls back. Run it on a local or preview database, not production:

```sh
psql "$DATABASE_URL" -f supabase/tests/access_rls_test.sql
```
