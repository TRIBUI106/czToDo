# Task 2 Report: Create TypeScript types and shared utilities

**Date:** 2026-09-07
**Status:** ⚠️ DONE_WITH_CONCERNS

## 1. Steps Completed

### Step 1: Create types.ts — DONE
Created `extension/lib/types.ts` with the exact code from the plan (section 3.2, Task 2, Step 1):
- `Todo` interface (13 fields: id, user_id, title, description, status, priority, source_url, source_type, github_issue_id, created_at, updated_at, due_date, tags)
- `AuthToken` interface
- `SyncQueueItem` interface
- `ExtensionState` interface

### Step 2: Create messages.ts — DONE
Created `extension/lib/messages.ts` with the exact code from the plan (Step 2):
- `MessageType` union (9 variants)
- `Message<T>` interface
- `MessageResponse<T>` interface
- `createMessage()` helper function
- `createResponse()` helper function

### Step 3: Create storage.ts — DONE
Created `extension/lib/storage.ts` with the exact code from the plan (Step 3):
- `storage` object with all 13 required methods: `getTodos`, `setTodos`, `setSyncStatus`, `getSyncStatus`, `setLastSyncTime`, `getLastSyncTime`, `getAuthToken`, `setAuthToken`, `getSyncQueue`, `addToSyncQueue`, `clearSyncQueue`, `removeSyncQueueItem`, `getOnlineStatus`, `setOnlineStatus`

### Step 4: Commit — DONE
Committed exactly the three files per the plan's commit command.

## 2. TypeScript Compilation Output

Ran `npx tsc --noEmit -p tsconfig.json` (the project's actual tsconfig, which includes `**/*.ts`):

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

All 15 errors are `Cannot find name 'chrome'` in `storage.ts`, and only in `storage.ts` — `types.ts` and `messages.ts` compile with zero errors. The fallback command (`npx tsc --lib es2020 extension/lib/*.ts --target es2020 --noEmit`) produces the identical set of `chrome` errors.

**Root cause:** the `chrome.*` global namespace types come from the `@types/chrome` package, which per the plan itself is installed in **Task 5, Step 1** (`npm install --save-dev ... @types/chrome ...`), not Task 2. Task 2's own description says "No external dependencies — pure TypeScript," but the code it specifies (`storage.ts`) references the `chrome` global, which is only type-safe once `@types/chrome` exists. This is an ordering artifact in the plan, not a mistake in the copied code — the code matches the plan exactly, character for character.

I did not install `@types/chrome` early, since:
1. The plan explicitly assigns that install to Task 5.
2. Doing so would modify `package.json`/lockfile outside this task's declared file scope, which the plan reserves for Task 5's commit.

## 3. Commit Hash(es)

- `8458d3b146294a0a6c0971bd3ffebfb82f0afac7` — feat: add TypeScript types and storage utilities (files: `extension/lib/types.ts`, `extension/lib/messages.ts`, `extension/lib/storage.ts`)

## 4. Concerns

1. **`storage.ts` does not type-check standalone until Task 5 installs `@types/chrome`.** This is expected given the plan's task ordering (Task 5 Step 1 installs the package), not a defect in this task's output. `types.ts` and `messages.ts` — the two files with no `chrome` dependency — compile cleanly right now. Flagging so Task 5 (or its verifier) confirms the `chrome` errors disappear once `@types/chrome` is installed and no `tsconfig.json` changes are additionally needed (e.g., adding `"types": ["chrome"]` or including `@types/chrome`'s ambient types) for `storage.ts` to fully resolve.
2. No other deviations from the plan's exact code.

## Status: ⚠️ DONE_WITH_CONCERNS
