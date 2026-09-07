# Task 3 Report: Create Supabase client factory

**Date:** 2026-09-07
**Status:** ⚠️ DONE_WITH_CONCERNS

## 1. Steps Completed

### Prerequisite verification
- Confirmed Task 2 files exist: `extension/lib/types.ts`, `extension/lib/messages.ts`, `extension/lib/storage.ts`.
- Confirmed `.env.local` exists (from Task 1) with `SUPABASE_URL` / `SUPABASE_ANON_KEY` placeholders.

### Step 1: Create `extension/lib/supabase.ts` — DONE
Created with the exact code from the plan (section 3.2, Task 3, Step 1): `createSupabaseClient()`, `getSupabaseClient()`, `signOut()`, `signInWithPassword()`, `signUp()` — character-for-character match, including the `persistSession: false` config and the `onAuthStateChange` listener that persists tokens via `storage.setAuthToken`.

### Step 2: Update `.env.local` with Supabase credentials — DONE
Added the `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` placeholder entries required by the plan's Step 2, alongside the existing (non-prefixed) `SUPABASE_URL` / `SUPABASE_ANON_KEY` entries from Task 1. `.env.local` remains gitignored (`.gitignore` already has `.env*.local` and `.env`).

### Step 3: Install Supabase client — DONE
Ran `npm install @supabase/supabase-js@^2.38.0`. npm (v11.16.0) resolved and installed `2.115.0` (the latest release satisfying `^2.38.0`) and wrote `"@supabase/supabase-js": "^2.115.0"` into `package.json` — this is npm's standard behavior of pinning the caret range to the actually-installed version rather than echoing the literal range typed on the command line. The installed version fully satisfies the plan's `^2.38.0` constraint.

### Step 4: Commit — DONE
Committed `extension/lib/supabase.ts`, `package.json`, and `package-lock.json` (the lockfile changed as a direct, necessary consequence of the install and was included so the lockfile stays in sync with `package.json`; the plan's literal commit command only listed the first two).

## 2. TypeScript Compilation Output

Ran `npx tsc --noEmit -p tsconfig.json`:

```
extension/lib/storage.ts(9,26): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(14,11): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(18,11): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(22,26): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(27,11): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(31,26): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(37,26): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(43,13): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(45,13): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(50,26): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(57,11): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(61,11): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(67,11): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(71,26): error TS2304: Cannot find name 'chrome'.
extension/lib/storage.ts(76,11): error TS2304: Cannot find name 'chrome'.
```

Identical to the 15 pre-existing `chrome`-global errors reported in Task 2 (carried forward, unresolved until Task 5 installs `@types/chrome`). **No new errors were introduced by `extension/lib/supabase.ts`** — no `TS2304` for `process` (since `@types/node` is already a devDependency) and no errors on the `@supabase/supabase-js` import or any of the 5 new functions.

## 3. Commit Hash(es)

- `9390a0b` — feat: add Supabase client factory (files: `extension/lib/supabase.ts`, `package.json`, `package-lock.json`)

## 4. Concerns

1. **Carried-forward `chrome` errors (expected, not new):** Same as flagged in Task 2 — `storage.ts`'s 15 `chrome`-global errors only resolve once Task 5 installs `@types/chrome`. `supabase.ts` itself compiles clean.
2. **`process.env.REACT_APP_SUPABASE_URL!` / `REACT_APP_SUPABASE_ANON_KEY!` are non-null-asserted placeholders.** Currently `.env.local` holds dummy placeholder values (`https://your-project.supabase.co` / `your-anon-key`), not real credentials — `createSupabaseClient()` will construct a client pointed at a non-existent project until Task 1's real Supabase project values are filled in. This matches the plan's expectations (env checking deferred) and doesn't block this task.
3. **`package.json` records `^2.115.0` instead of the literal `^2.38.0` from the plan.** This is standard npm v11 behavior (installs latest matching the given range, then writes that resolved version's caret range) — the installed package still satisfies the plan's `^2.38.0` constraint, so this is not a deviation in intent, only in the recorded semver string.
4. Included `package-lock.json` in the commit even though the plan's literal `git add` command didn't list it — necessary to keep the lockfile consistent with the new dependency; omitting it would leave a dirty/out-of-sync lockfile.
5. No other deviations from the plan's exact code — all 5 functions (`createSupabaseClient`, `getSupabaseClient`, `signOut`, `signInWithPassword`, `signUp`) match the plan verbatim.

## Status: ⚠️ DONE_WITH_CONCERNS
