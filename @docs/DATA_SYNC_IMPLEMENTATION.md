# Data Sync Implementation Guide: Supabase Unification

**Status:** 📋 Implementation Strategy & Checklist

**Target:** Unify web app and extension under single Supabase database

**Estimated Effort:** 2-3 weeks

**Difficulty:** 🔴 **HIGH** (major refactoring required)

---

## 🎯 Goal

Make todo data **real-time synchronize** between web app and Chrome extension using:
- **Single Database:** Supabase PostgreSQL (shared)
- **Single Auth:** Supabase Authentication
- **Single Schema:** Unified Todo model
- **Real-time Sync:** Supabase subscriptions & updates

---

## 📊 Current vs Target State

### Current (Broken)
```
User (Web)  ─┬─────────────────┬─ User (Extension)
             │                 │
     NextAuth.js         Supabase Auth
             │                 │
         PostgreSQL     Supabase DB
        (No Sync)
        Different User IDs, Different Todos
```

### Target (Unified)
```
User (Web & Extension) ─────────┐
                                │
                        Supabase Auth
                                │
                        Supabase DB
                        (Real-time Sync)
                   Same User ID, Same Todos
```

---

## 🔧 Phase 1: Preparation

### Task 1.1: Audit Current Setup

**Checklist:**
- [ ] Document all current Supabase users and todos
- [ ] List all users in NextAuth/PostgreSQL
- [ ] Export PostgreSQL todos data:
  ```bash
  npx prisma db push
  npx prisma generate
  npx prisma studio  # View data
  ```
- [ ] Count rows to migrate
- [ ] Document any custom scripts using PostgreSQL
- [ ] List API endpoints using Prisma
- [ ] Check for hardcoded PostgreSQL assumptions

**Command to export data:**
```bash
# Export users
psql $DATABASE_URL -c "SELECT * FROM \"User\" ORDER BY id;" > users.csv

# Export todos
psql $DATABASE_URL -c "SELECT * FROM \"Todo\" ORDER BY id;" > todos.csv
```

### Task 1.2: Verify Supabase Setup

**Checklist:**
- [ ] Confirm Supabase credentials in `.env.local`
- [ ] Test Supabase connection from extension
- [ ] Verify RLS policies on extension `todos` table
- [ ] Confirm Supabase auth is working
- [ ] Check storage quotas and limits
- [ ] Verify Realtime is enabled for todos table

**Test Supabase connection:**
```typescript
import { createClient } from '@supabase/supabase-js';

const client = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Test auth
const { data: { user } } = await client.auth.getUser();
console.log('Supabase connected:', !!user);

// Test data access
const { data, error } = await client
  .from('todos')
  .select('*')
  .limit(1);
console.log('Can read todos:', !error, error?.message);
```

### Task 1.3: Plan Schema Migration

**Unified Schema (Target):**
```sql
CREATE TABLE todos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core fields (from web + extension)
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status (unified from 'completed' boolean + 'status' enum)
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'archived')),
  
  -- Priority
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Categories (from web app)
  category TEXT,
  
  -- Dates
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Extension-only fields
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('popup', 'context_menu', 'github', 'email', 'slack')),
  github_issue_id TEXT,
  tags TEXT[],
  
  -- Indexes
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_category (category)
);

-- Enable Realtime
ALTER TABLE todos REPLICA IDENTITY FULL;

-- RLS Policies
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Users can only see their own todos
CREATE POLICY "Users can see own todos"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create their own todos
CREATE POLICY "Users can create own todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own todos
CREATE POLICY "Users can update own todos"
  ON todos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own todos
CREATE POLICY "Users can delete own todos"
  ON todos FOR DELETE
  USING (auth.uid() = user_id);
```

**Schema Mapping (Web → Unified):**
```
completed (boolean) → status ('active'|'completed'|'archived')
  - completed: true  → 'completed'
  - completed: false → 'active'

priority (UPPERCASE) → priority (lowercase)
  - HIGH   → 'high'
  - MEDIUM → 'medium'
  - LOW    → 'low'

userId → user_id (from auth.users)

createdAt → created_at

updatedAt → updated_at

dueDate → due_date

category → category (new field, optional)
```

---

## 🌐 Phase 2: Web App Migration

### Task 2.1: Add Supabase Client to Web App

**File: `src/lib/supabase-client.ts` (NEW)**
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**Update: `.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Task 2.2: Migrate Authentication

**Remove:**
- [ ] Remove NextAuth.js configuration
- [ ] Remove `src/lib/auth.ts`
- [ ] Remove auth API routes

**Create: `src/app/auth/login/page.tsx`**
```typescript
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

**Create: `src/app/auth/signup/page.tsx`**
```typescript
// Similar to login, but uses signUp() instead
```

### Task 2.3: Migrate Todo API Endpoints

**File: `src/app/api/todos/route.ts` (REPLACE)**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function GET(req: NextRequest) {
  try {
    // Get user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query todos from Supabase
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, priority, category, dueDate } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        title,
        description,
        priority: priority?.toLowerCase() || 'medium',
        category,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Task 2.4: Update Todo Components

**File: `src/components/TodoList.tsx` (UPDATE)**
```typescript
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export function TodoList() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    // Fetch initial todos
    async function loadTodos() {
      const { data } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });
      
      setTodos(data || []);
    }

    loadTodos();

    // Subscribe to real-time updates
    const subscription = supabase
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'todos' 
        },
        (payload) => {
          // Handle real-time updates
          if (payload.eventType === 'INSERT') {
            setTodos([payload.new, ...todos]);
          } else if (payload.eventType === 'UPDATE') {
            setTodos(todos.map(t => t.id === payload.new.id ? payload.new : t));
          } else if (payload.eventType === 'DELETE') {
            setTodos(todos.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="todo-list">
      {todos.map(todo => (
        <div key={todo.id} className="todo-item">
          <h3>{todo.title}</h3>
          <p>{todo.description}</p>
          <span className={`status-${todo.status}`}>{todo.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### Task 2.5: Remove Prisma & NextAuth Dependencies

**File: `package.json` (UPDATE)**
```bash
# Remove
npm uninstall next-auth bcryptjs @prisma/client prisma

# Add
npm install @supabase/supabase-js
```

**Remove files:**
- [ ] Delete `prisma/schema.prisma`
- [ ] Delete `prisma/migrations/`
- [ ] Delete `src/lib/auth.ts`
- [ ] Delete `src/lib/prisma.ts`
- [ ] Delete `src/app/api/auth/`

---

## ✅ Phase 3: Schema Unification

### Task 3.1: Create Supabase Migration

**Via Supabase Dashboard:**
1. Go to SQL Editor
2. Create new query
3. Run migration script:

```sql
-- Add new columns to unified schema
ALTER TABLE todos
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_type TEXT,
ADD COLUMN IF NOT EXISTS github_issue_id TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- If migrating from old schema with 'completed' field
ALTER TABLE todos
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Migrate completed boolean to status enum
UPDATE todos 
SET status = CASE 
  WHEN completed = true THEN 'completed' 
  ELSE 'active' 
END
WHERE status IS NULL;

-- Drop old column after migration
ALTER TABLE todos
DROP COLUMN IF EXISTS completed;
```

### Task 3.2: Verify Schema

**Supabase → SQL Editor:**
```sql
-- Check todos table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'todos'
ORDER BY column_name;
```

**Expected output:**
```
category             | text      | yes
created_at           | timestamp | no
description          | text      | yes
due_date             | timestamp | yes
github_issue_id      | text      | yes
id                   | text      | no
priority             | text      | yes
source_type          | text      | yes
source_url           | text      | yes
status               | text      | no
tags                 | text[]    | yes
title                | text      | no
updated_at           | timestamp | no
user_id              | text      | no
```

---

## 🧪 Phase 4: Testing

### Task 4.1: Unit Tests

**File: `src/__tests__/supabase.test.ts`**
```typescript
describe('Supabase Integration', () => {
  it('should fetch todos for authenticated user', async () => {
    // Test todo retrieval
  });

  it('should create todo with all fields', async () => {
    // Test todo creation
  });

  it('should sync status change between web and extension', async () => {
    // Test real-time sync
  });

  it('should handle schema field mapping', async () => {
    // Test field transformation (priority case, status enum, etc.)
  });
});
```

### Task 4.2: Integration Tests

**Manual Testing Checklist:**
- [ ] Sign up in web app
- [ ] Create todo in web app
- [ ] Sign into extension with same credentials
- [ ] Verify todo appears in extension (real-time)
- [ ] Update todo in web app
- [ ] Verify update appears in extension
- [ ] Create todo in extension
- [ ] Verify todo appears in web app
- [ ] Delete todo from web app
- [ ] Verify deletion synced to extension
- [ ] Test offline: Create todo in extension offline
- [ ] Verify todo synced when coming online

### Task 4.3: Performance Testing

- [ ] Measure sync latency (should be <1 second)
- [ ] Test with 100+ todos
- [ ] Monitor subscription connections
- [ ] Check memory usage

---

## 🚚 Phase 5: Data Migration

### Task 5.1: Prepare Migration Script

**File: `scripts/migrate-data.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Note: service role for admin access
);

const prisma = new PrismaClient();

async function migrateUsers() {
  console.log('Migrating users...');
  
  // This is complex - users come from NextAuth, need to create in Supabase
  // Requires manual user email list or admin API call
  
  // For now, users should manually sign up in web app using Supabase auth
  console.log('Users will need to sign up in migrated web app');
}

async function migrateTodos() {
  console.log('Migrating todos...');
  
  const todos = await prisma.todo.findMany({
    include: { user: true }
  });

  for (const todo of todos) {
    try {
      // Map priority
      const priority = todo.priority.toLowerCase();
      
      // Map status
      const status = todo.completed ? 'completed' : 'active';

      await supabase
        .from('todos')
        .insert({
          title: todo.title,
          description: todo.description,
          priority,
          status,
          category: todo.category,
          due_date: todo.dueDate,
          created_at: todo.createdAt.toISOString(),
          updated_at: todo.updatedAt.toISOString(),
          // Note: user_id mapping requires knowing Supabase user IDs
          // This is complex and needs manual mapping
        });

      console.log(`✓ Migrated todo: ${todo.title}`);
    } catch (error) {
      console.error(`✗ Failed to migrate todo ${todo.id}:`, error);
    }
  }
}

async function main() {
  await migrateUsers();
  await migrateTodos();
  console.log('Migration complete');
}

main().catch(console.error);
```

### Task 5.2: Execute Migration

```bash
# Test migration first (recommended)
npm run migrate:dry-run

# Then execute
npm run migrate:data

# Verify
# 1. Check Supabase data
# 2. Compare row counts
# 3. Spot-check data integrity
```

---

## 🎯 Phase 6: Rollout & Cleanup

### Task 6.1: Deploy Web App Changes

```bash
# Build and test
npm run build
npm run start

# If self-hosted, deploy to your server
# If using Vercel, push to master branch
```

### Task 6.2: Update Environment Variables

**Vercel (if using):**
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Remove old Prisma variables

**Self-hosted:**
- [ ] Update `.env` with Supabase credentials
- [ ] Restart application

### Task 6.3: Verify Sync

**Post-deployment checks:**
- [ ] Users can log in
- [ ] Can view todos
- [ ] Real-time sync works (both directions)
- [ ] Extension still works
- [ ] Performance is acceptable

### Task 6.4: Cleanup

- [ ] Decommission PostgreSQL (after 1-2 weeks confirmation)
- [ ] Remove Prisma from codebase
- [ ] Archive old database backups
- [ ] Update documentation
- [ ] Update CI/CD if needed

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Data loss during migration | 🔴 CRITICAL | Backup PostgreSQL before migration |
| User confusion with re-auth | 🟡 MEDIUM | Clear communication, gradual rollout |
| Breaking changes in API | 🔴 CRITICAL | Maintain API compatibility layer |
| Performance regression | 🟡 MEDIUM | Load test before production |
| Sync failures | 🟡 MEDIUM | Implement retry logic, monitoring |

---

## 📚 Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Data Migration Guide](https://supabase.com/docs/reference/javascript/migration)

---

## 📝 Checklist Summary

### Phase 1: Preparation
- [ ] Audit current setup
- [ ] Export all data
- [ ] Verify Supabase
- [ ] Plan schema migration

### Phase 2: Web App Migration  
- [ ] Add Supabase client
- [ ] Migrate authentication
- [ ] Migrate API endpoints
- [ ] Update components
- [ ] Remove NextAuth/Prisma

### Phase 3: Schema Unification
- [ ] Create migration script
- [ ] Verify schema in Supabase
- [ ] Ensure RLS policies

### Phase 4: Testing
- [ ] Write unit tests
- [ ] Manual integration tests
- [ ] Performance testing
- [ ] Load testing

### Phase 5: Data Migration
- [ ] Create migration script
- [ ] Test migration (dry run)
- [ ] Execute migration
- [ ] Verify data integrity

### Phase 6: Rollout
- [ ] Deploy web app
- [ ] Update environment variables
- [ ] Verify sync works
- [ ] Monitor for issues
- [ ] Cleanup

---

**Next Step:** Start with Phase 1 (Preparation) to audit current setup and plan the migration.
