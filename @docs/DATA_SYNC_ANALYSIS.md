# Data Synchronization Analysis: Web App vs Chrome Extension

**Status:** ⚠️ **NOT CURRENTLY SYNCED** - Separate databases, different schemas

**Last Updated:** September 8, 2026

---

## 📋 Executive Summary

The czToDo web application and Chrome extension currently **do not synchronize data**. They use:
- Separate authentication systems
- Different database technologies
- Incompatible data schemas
- No sync mechanism

A user's todos in the web app will **NOT** appear in the extension, and vice versa.

---

## 🔍 Current Architecture

### Web Application (Next.js)

**Authentication:** NextAuth.js
- Local credentials (email + password)
- JWT-based sessions
- Stored in PostgreSQL via Prisma

**Database:** PostgreSQL (Prisma ORM)
- Managed by Prisma
- Self-hosted or cloud PostgreSQL

**Schema (Prisma Model):**
```prisma
model Todo {
  id          String    @id @default(cuid())
  title       String
  description String?
  completed   Boolean   @default(false)    // ← Boolean flag
  priority    Priority  @default(MEDIUM)   // ← Enum: LOW, MEDIUM, HIGH
  category    String?                      // ← Web-only field
  dueDate     DateTime?                    // ← camelCase
  createdAt   DateTime  @default(now())    // ← camelCase
  updatedAt   DateTime  @updatedAt         // ← camelCase
  userId      String
  user        User      @relation(...)
  @@index([userId])
}
```

### Chrome Extension

**Authentication:** Supabase Auth
- Email + password or social login
- JWT tokens stored in Chrome storage
- Managed by Supabase

**Database:** Supabase (PostgreSQL)
- Direct Supabase client (RLS enabled)
- Cloud-hosted PostgreSQL

**Schema (TypeScript Interface):**
```typescript
interface Todo {
  id: string;
  user_id: string;                              // ← snake_case
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';  // ← Enum: 3 states (not boolean)
  priority?: 'low' | 'medium' | 'high';         // ← lowercase
  source_url?: string;                          // ← Extension-only
  source_type?: 'popup' | 'context_menu' | ...  // ← Extension-only
  github_issue_id?: string;                     // ← Extension-only
  created_at: string;                           // ← snake_case, ISO string
  updated_at: string;                           // ← snake_case, ISO string
  due_date?: string;                            // ← snake_case
  tags?: string[];                              // ← Extension-only
}
```

---

## 🚨 Schema Incompatibilities

| Field | Web (Prisma) | Extension (Supabase) | Type | Issue |
|-------|--------------|---------------------|------|-------|
| ID | `id` (cuid) | `id` | ✅ Compatible | Both use string IDs |
| User ID | `userId` | `user_id` | ⚠️ Mismatch | Different naming (camelCase vs snake_case) |
| Title | `title` | `title` | ✅ Compatible | - |
| Description | `description` | `description` | ✅ Compatible | - |
| **Status** | `completed` (Boolean) | `status` (Enum) | ❌ **MAJOR** | Web: bool / Ext: 3-state enum |
| Priority | `priority` (Enum) | `priority` (Enum) | ⚠️ Mismatch | Web: UPPERCASE / Ext: lowercase |
| Category | `category` | ❌ Missing | ❌ **MISSING** | Only in web app |
| Due Date | `dueDate` | `due_date` | ⚠️ Mismatch | Different naming + format |
| Created | `createdAt` (DateTime) | `created_at` (string) | ⚠️ Mismatch | Different format |
| Updated | `updatedAt` (DateTime) | `updated_at` (string) | ⚠️ Mismatch | Different format |
| Source URL | ❌ Missing | `source_url` | ❌ **MISSING** | Only in extension |
| Source Type | ❌ Missing | `source_type` | ❌ **MISSING** | Only in extension |
| GitHub Issue | ❌ Missing | `github_issue_id` | ❌ **MISSING** | Only in extension |
| Tags | ❌ Missing | `tags` (array) | ❌ **MISSING** | Only in extension |

---

## 🔐 Authentication Mismatch

### Web App Flow
1. User signs up/logs in via NextAuth
2. Credentials stored in PostgreSQL (bcrypt hashed)
3. Session stored as JWT
4. API endpoints require NextAuth session

### Extension Flow
1. User signs up/logs in via Supabase Auth
2. Credentials stored in Supabase Auth database
3. JWT stored in Chrome storage
4. API calls use Supabase auth token

### Problem
- **Different user databases**: A user created in web app doesn't exist in Supabase
- **No auth bridge**: No way to link web app user to Supabase user
- **Session management**: Different token handling

---

## 💾 Database Architecture

### Current Setup (Separate)

```
┌─────────────────────────┐
│   Web Browser           │
│  ┌────────────────────┐ │
│  │  Next.js Web App   │ │
│  │  - NextAuth        │ │
│  │  - Prisma ORM      │ │
│  └────────────────────┘ │
└──────────────┬──────────┘
               │
         ┌─────▼─────┐
         │ PostgreSQL│
         │ (Web DB)  │
         └───────────┘

┌─────────────────────────┐
│   Chrome Extension      │
│  ┌────────────────────┐ │
│  │  React UI          │ │
│  │  - Supabase Auth   │ │
│  │  - Supabase Client │ │
│  └────────────────────┘ │
└──────────────┬──────────┘
               │
         ┌─────▼─────────────┐
         │   Supabase DB     │
         │ (Extension DB)    │
         │  (PostgreSQL)     │
         └───────────────────┘
```

### Consequence
- **Completely isolated databases**
- **No shared user records**
- **No data synchronization possible** without middleware

---

## ❌ Current Sync Status

### What Doesn't Work

❌ **Create todo in web app**
- Appears in Supabase? **NO**
- Visible in extension? **NO**
- Reason: Different databases, no sync

❌ **Create todo in extension**
- Appears in PostgreSQL? **NO**
- Visible in web app? **NO**
- Reason: Different databases, no sync

❌ **Update todo in web app**
- Synced to extension? **NO**
- Reason: No sync mechanism

❌ **Offline sync in extension**
- Synced to web app when online? **NO**
- Reason: No sync queue handler

---

## 🛠️ Solution Options

### Option 1: Unified Supabase (RECOMMENDED)

**Approach:**
- Migrate web app authentication to Supabase Auth
- Move web app data to Supabase (same database as extension)
- Remove Prisma/PostgreSQL dependency
- Use Supabase client everywhere

**Pros:**
- ✅ Single database (real-time sync possible)
- ✅ Single auth system (easier management)
- ✅ Works offline via Supabase client
- ✅ Real-time sync with Supabase subscriptions
- ✅ Simplified architecture

**Cons:**
- ❌ Major refactoring needed (web app)
- ❌ Migration of existing user data
- ❌ Different ORM approach (Supabase doesn't have Prisma equivalent)

**Effort:** 🔴 **HIGH** (2-3 weeks)

---

### Option 2: Sync Middleware

**Approach:**
- Keep both databases separate
- Create a sync service (Node.js middleware)
- Sync via scheduled jobs or webhooks
- Transform data between schemas

**Example Flow:**
```
Web App Creates Todo
    ↓
Supabase Real-time Listener
    ↓
Sync Service (Transform + Map)
    ↓
PostgreSQL Update
    ↓
Extension Sees Updated Todo
```

**Pros:**
- ✅ Minimal changes to existing code
- ✅ Gradual implementation
- ✅ Can use existing Supabase for extension
- ✅ Schema can diverge if needed

**Cons:**
- ⚠️ Eventual consistency (not real-time)
- ⚠️ Requires additional infrastructure
- ⚠️ Sync failures possible
- ⚠️ Complexity in keeping schemas aligned

**Effort:** 🟡 **MEDIUM** (1-2 weeks)

---

### Option 3: API Bridge

**Approach:**
- Add API endpoints in Next.js for extension
- Extension calls web app API instead of Supabase
- Single source of truth: PostgreSQL

**Example Flow:**
```
Extension UI
    ↓
Extension Code
    ↓
POST /api/extension/todos (to Next.js)
    ↓
NextAuth Validation
    ↓
Prisma Database Query
    ↓
Return Data to Extension
```

**Pros:**
- ✅ Single database (PostgreSQL)
- ✅ Minimal data transformation needed
- ✅ Works with existing web app
- ✅ Moderate implementation effort

**Cons:**
- ❌ Extension requires network (can't be fully offline)
- ⚠️ Needs proper CORS/auth handling
- ⚠️ Web app becomes critical path

**Effort:** 🟡 **MEDIUM** (1 week)

---

## 📋 Recommended Implementation: Option 1 (Unified Supabase)

### Why?
1. **Real-time sync** - Supabase subscriptions enable instant updates
2. **Offline support** - Both web and extension can work offline
3. **Simplified auth** - Single auth system
4. **Professional** - Industry standard for full-stack apps
5. **Scalability** - Easier to add features later

### Implementation Steps

#### Phase 1: Preparation
1. Audit existing Supabase setup (extension already using it)
2. Export all user data from PostgreSQL
3. Plan schema migration
4. Set up Supabase authentication rules

#### Phase 2: Web App Migration
1. Install `@supabase/supabase-js` in web app
2. Create `lib/supabase-client.ts` (web app version)
3. Migrate NextAuth to Supabase Auth:
   - Create login page that uses `client.auth.signInWithPassword()`
   - Create signup page that uses `client.auth.signUp()`
   - Create logout that uses `client.auth.signOut()`
4. Replace Prisma calls with Supabase client calls
5. Update API endpoints to use Supabase instead of Prisma

#### Phase 3: Schema Unification
1. Create Supabase migration script:
   ```sql
   -- Ensure todos table has all needed fields
   ALTER TABLE todos ADD COLUMN category TEXT;
   ALTER TABLE todos ADD COLUMN tags TEXT[];
   -- Migrate completed boolean to status enum
   ALTER TABLE todos ADD COLUMN status TEXT;
   UPDATE todos SET status = CASE 
     WHEN completed = true THEN 'completed' 
     ELSE 'active' 
   END;
   ALTER TABLE todos DROP COLUMN completed;
   ```

2. Update TypeScript types to match Supabase schema
3. Update Prisma schema (if keeping it) to match reality

#### Phase 4: Testing & Rollout
1. Test web app with Supabase client
2. Test sync between web and extension
3. Test offline functionality
4. Migrate users from PostgreSQL to Supabase
5. Deprecate PostgreSQL connection

#### Phase 5: Cleanup
1. Remove Prisma from web app (if fully migrated)
2. Decommission PostgreSQL
3. Update documentation
4. Update CI/CD if needed

---

## 🔄 Quick Sync Test (Current State)

To verify the current sync status:

### Test 1: Web App → Extension
```bash
1. Sign up in web app (nextjs.local/auth/signup)
2. Create a todo "Test from web"
3. Sign up in extension with same email
4. Check if "Test from web" appears in extension
Expected: ❌ NOT present (different databases)
```

### Test 2: Extension → Web App
```bash
1. Sign up in extension
2. Create a todo "Test from extension"
3. Sign up in web app with same email
4. Check if "Test from extension" appears in web app
Expected: ❌ NOT present (different databases)
```

---

## 📚 Related Files

### Web App Code
- `prisma/schema.prisma` - Database schema
- `src/app/api/todos/route.ts` - Todo API
- `src/lib/auth.ts` - NextAuth configuration

### Extension Code
- `extension/lib/types.ts` - Todo interface
- `extension/popup/hooks/useTodos.ts` - Todo operations
- `extension/lib/supabase.ts` - Supabase client setup

### Configuration
- `.env.local` - Environment variables for extension
- `.env` - Environment variables for web app

---

## ⚠️ Critical Notes

1. **Users are completely separate**
   - User created in web app: Only in PostgreSQL
   - User created in extension: Only in Supabase
   - No way to link them

2. **Data is duplicated if both are used**
   - Same person might have different todos in web vs extension
   - Causes confusion

3. **Offline support differs**
   - Web app: No offline support (requires Next.js server)
   - Extension: Has offline queue (via sync service)

4. **Future integrations**
   - Gmail/Slack capture: Goes to extension only
   - GitHub issues: Goes to extension only
   - Web app has no way to see these

---

## 🎯 Next Steps

**Recommendation:** Implement **Option 1 (Unified Supabase)**

1. **Week 1:** Prepare migration, export data, test Supabase setup
2. **Week 2:** Migrate web app auth to Supabase
3. **Week 3:** Unify schemas and test sync
4. **Week 4:** User migration and cleanup

---

## 📖 Documentation Links

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Client Reference](https://supabase.com/docs/reference/javascript)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Status:** This analysis is complete. Implementation can begin with migration strategy outlined above.
