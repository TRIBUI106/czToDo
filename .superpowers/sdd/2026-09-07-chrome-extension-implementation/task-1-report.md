# Task 1 Report: Set up Supabase project and database schema

**Date:** 2026-09-07
**Status:** ⚠️ DONE_WITH_CONCERNS

## 1. Steps Completed

### Step 1: Migration file — DONE
Created `supabase/migrations/001_create_todos_table.sql` with the exact SQL from the plan:
- `uuid-ossp` extension enabled
- `public.todos` table with all 13 columns (id, user_id, title, description, status, priority, source_url, source_type, github_issue_id, created_at, updated_at, due_date, tags)
- 3 indexes: `(user_id, status)`, `(user_id, created_at desc)`, `(user_id, updated_at desc)`
- RLS enabled
- Two RLS policies: "Users can only access their own todos" (FOR ALL) and "Users can insert their own todos" (FOR INSERT)

### Step 2: Supabase CLI — DONE
Ran `npm install --save-dev @supabase/cli` (recorded as `"@supabase/cli": "^1.0.0"` in devDependencies).
Added scripts to `package.json`:
- `"supabase:migrate": "supabase migration up --local"`
- `"supabase:link": "supabase link --project-ref <your-project-ref>"`

### Step 3: Create Supabase cloud project — NOT DONE (manual, blocked)
Requires a human to create an account/project at https://supabase.com/dashboard and copy the Project URL, anon key, and Project Ref. No dashboard access or credentials are available in this environment.

### Step 4: Link and migrate (cloud) — NOT DONE (depends on Step 3)
Cloud link/migrate cannot run without a real project-ref and credentials.
**Compensating verification:** The migration was applied and fully verified against a LOCAL Supabase stack (Docker) instead — see Test Output below. This proves the SQL is valid and produces the correct schema.

### Step 5: `.env.local` — DONE
Created `.env.local` (placeholder values, real values pending Step 3):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```
Confirmed ignored by git (`git check-ignore .env.local` → matched). `.gitignore` already contained `.env*.local` and `.env`, which cover both `.env.local` and `.env.*.local`, so no change to `.gitignore` was required.

### Step 6: Commit — DONE
Committed only the migration file and `package.json` per the plan.

## 2. Test Output (local Supabase verification)

Migration application log:
```
Applying migration 001_create_todos_table.sql...
```
(no errors)

**Columns** (name | type | nullable | default):
```
id              | uuid                        | NO  | uuid_generate_v4()
user_id         | uuid                        | NO  | -
title           | text                        | NO  | -
description     | text                        | YES | -
status          | text                        | NO  | 'active'
priority        | text                        | YES | -
source_url      | text                        | YES | -
source_type     | text                        | YES | -
github_issue_id | text                        | YES | -
created_at      | timestamp with time zone    | YES | now()
updated_at      | timestamp with time zone    | YES | now()
due_date        | date                        | YES | -
tags            | ARRAY (text[])              | YES | -
```

**Indexes:**
```
todos_pkey
todos_user_id_created_idx
todos_user_id_status_idx
todos_user_id_updated_idx
```

**RLS:** `rls_enabled=true`

**Policies:**
```
Users can insert their own todos       | INSERT | roles=public
Users can only access their own todos   | ALL    | roles=public
```

**CHECK constraints:**
```
CHECK (status IN ('active','completed','archived'))
CHECK (priority IN ('low','medium','high'))
CHECK (source_type IN ('popup','context_menu','github','email'))
```

**Foreign key:**
```
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
```

All success criteria that can be verified without cloud credentials are satisfied.

## 3. Concerns / Issues

1. **Cloud project not created (Steps 3-4).** These require manual human action in the Supabase dashboard (account creation, project "czToDo", copying URL/anon key/project-ref) and cannot be performed in this environment. Verification of the cloud `todos` table is therefore pending; the schema was instead verified against a local Supabase Postgres stack.
2. **`@supabase/cli` package.** The plan's exact command installs `@supabase/cli@^1.0.0`, which is a thin/placeholder npm package. The actual working CLI binary is provided by the `supabase` npm package (resolved to `supabase@2.116.0` via `npx supabase`), which is what actually ran init/start/migrate. Consider replacing the dev dependency with `supabase` for a self-contained toolchain.
3. **`package-lock.json` not committed.** Per the plan's Step 6, only `package.json` and the migration file were committed. `package-lock.json` was modified by the CLI install but left uncommitted to match the plan exactly. Committing it later would keep the lockfile consistent.
4. **Local init side artifacts.** `supabase init` created `supabase/config.toml` and `supabase/.gitignore` (both untracked). They were not committed because the plan's Step 6 stages only the migration and `package.json`. `config.toml` is normally worth committing; left to the controller's discretion.
5. The existing repo is currently a Next.js + Prisma app; the Supabase/Chrome-extension stack is being introduced alongside it. No conflicts arose in this task.

## 4. Commit Hash(es)

- `234b58c35dc31bca2b360ddba835a2bb7d39cb44` — chore: add Supabase migrations for todos table (files: `supabase/migrations/001_create_todos_table.sql`, `package.json`)
