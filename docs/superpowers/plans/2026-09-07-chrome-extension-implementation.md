# Chrome Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully-functional Chrome extension for czToDo with popup UI, Supabase sync, context menus, and GitHub integration.

**Architecture:** Service Worker (background) manages Supabase realtime sync and offline queue. React popup provides UI. Content scripts handle web page interactions. All three communicate via message passing.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Supabase, Chrome Manifest V3, Webpack

**Spec:** `docs/superpowers/specs/2026-09-07-chrome-extension-design.md`

## Global Constraints

- **Manifest Version:** V3 (no persistent background pages)
- **Node Version:** ≥18.0.0
- **React:** ^18.0.0
- **TypeScript:** ^5.0.0
- **Supabase Client:** @supabase/supabase-js ^2.38.0
- **Storage:** `chrome.storage.sync` (cross-device), `chrome.storage.local` (local queue)
- **Auth Token Storage:** `chrome.storage.local` only (not synced to server)

---

## Phase 1: Core Popup + Sync Setup

### File Structure Overview

```
czToDo/
├── extension/
│   ├── manifest.json              # Chrome extension manifest
│   ├── popup.html                 # Popup shell
│   ├── popup/
│   │   ├── App.tsx               # Main popup component
│   │   ├── components/
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoForm.tsx
│   │   │   ├── SyncStatus.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── hooks/
│   │   │   ├── useTodos.ts
│   │   │   └── useAuth.ts
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── background/
│   │   ├── index.ts              # Service worker entry
│   │   ├── supabase.ts           # Supabase client init
│   │   └── sync.ts               # Sync queue & listener logic
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client factory
│   │   ├── storage.ts            # chrome.storage helpers
│   │   ├── messages.ts           # Message types
│   │   └── types.ts              # Shared TypeScript types
│   └── assets/
│       ├── icons/
│       │   ├── icon-16.png
│       │   ├── icon-48.png
│       │   └── icon-128.png
│       └── styles.css            # Global styles
│
├── webpack.extension.js
├── tsconfig.extension.json
└── supabase/
    └── migrations/
        └── 001_create_todos_table.sql
```

---

### Task 1: Set up Supabase project and database schema

**Files:**
- Create: `supabase/migrations/001_create_todos_table.sql`
- Create: `.env.local` (local config, NOT committed)
- Modify: `package.json` (add supabase CLI as dev dependency)

**Interfaces:**
- Produces: Supabase project URL and API key (stored in `.env.local`)
- Produces: `todos` table with RLS policies
- Produces: `auth.users` table (managed by Supabase)

**Steps:**

- [ ] **Step 1: Create Supabase migration file**

Create `supabase/migrations/001_create_todos_table.sql`:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create todos table
create table public.todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  priority text check (priority in ('low', 'medium', 'high')),
  source_url text,
  source_type text check (source_type in ('popup', 'context_menu', 'github', 'email')),
  github_issue_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  due_date date,
  tags text[]
);

-- Create indexes
create index todos_user_id_status_idx on todos(user_id, status);
create index todos_user_id_created_idx on todos(user_id, created_at desc);
create index todos_user_id_updated_idx on todos(user_id, updated_at desc);

-- Enable RLS
alter table public.todos enable row level security;

-- RLS policy: users can only read/write their own todos
create policy "Users can only access their own todos"
  on todos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow inserting with user_id
create policy "Users can insert their own todos"
  on todos
  for insert
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Install Supabase CLI**

```bash
npm install --save-dev @supabase/cli
```

Update `package.json` scripts:
```json
{
  "scripts": {
    "supabase:migrate": "supabase migration up --local",
    "supabase:link": "supabase link --project-ref <your-project-ref>"
  }
}
```

- [ ] **Step 3: Create Supabase project**

Via Supabase dashboard at https://supabase.com/dashboard:
1. Create new project (name: "czToDo", region: closest to you)
2. Copy Project URL → save to `.env.local` as `SUPABASE_URL`
3. Copy API Key (anon) → save to `.env.local` as `SUPABASE_ANON_KEY`
4. Note the Project Ref for linking CLI

- [ ] **Step 4: Link and migrate**

```bash
npm run supabase:link  # Enter project ref when prompted
npm run supabase:migrate  # Apply migration
```

Verify in Supabase dashboard: Tables → todos table should exist with all columns.

- [ ] **Step 5: Create `.env.local` file (NOT committed)**

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Add to `.gitignore`:
```
.env.local
.env.*.local
```

- [ ] **Step 6: Commit schema migration only**

```bash
git add supabase/migrations/001_create_todos_table.sql package.json
git commit -m "chore: add Supabase migrations for todos table"
```

---

### Task 2: Create TypeScript types and shared utilities

**Files:**
- Create: `extension/lib/types.ts`
- Create: `extension/lib/messages.ts`
- Create: `extension/lib/storage.ts`

**Interfaces:**
- Produces: Type definitions used by popup, background, and content scripts
- Produces: Message passing interfaces for inter-component communication
- Produces: Helper functions for chrome.storage access

**Steps:**

- [ ] **Step 1: Create types.ts**

```typescript
// extension/lib/types.ts

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  source_url?: string;
  source_type?: 'popup' | 'context_menu' | 'github' | 'email';
  github_issue_id?: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  tags?: string[];
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface SyncQueueItem {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table: 'todos';
  data: Partial<Todo>;
  timestamp: number;
  retries: number;
}

export interface ExtensionState {
  todos: Todo[];
  auth: AuthToken | null;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime: number;
  isOnline: boolean;
}
```

- [ ] **Step 2: Create messages.ts**

```typescript
// extension/lib/messages.ts

export type MessageType = 
  | 'ADD_TODO'
  | 'UPDATE_TODO'
  | 'DELETE_TODO'
  | 'GET_TODOS'
  | 'SYNC_STATUS'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CAPTURE_TEXT'
  | 'GITHUB_ISSUE';

export interface Message<T = any> {
  type: MessageType;
  payload: T;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const createMessage = <T>(
  type: MessageType,
  payload: T
): Message<T> => ({
  type,
  payload,
});

export const createResponse = <T>(
  success: boolean,
  data?: T,
  error?: string
): MessageResponse<T> => ({
  success,
  data,
  error,
});
```

- [ ] **Step 3: Create storage.ts**

```typescript
// extension/lib/storage.ts

import { AuthToken, ExtensionState, SyncQueueItem, Todo } from './types';

// Chrome storage helpers
export const storage = {
  // Sync storage (cross-device)
  async getTodos(): Promise<Todo[]> {
    const result = await chrome.storage.sync.get('todos');
    return result.todos || [];
  },

  async setTodos(todos: Todo[]): Promise<void> {
    await chrome.storage.sync.set({ todos });
  },

  async setSyncStatus(status: ExtensionState['syncStatus']): Promise<void> {
    await chrome.storage.sync.set({ syncStatus: status });
  },

  async getSyncStatus(): Promise<ExtensionState['syncStatus']> {
    const result = await chrome.storage.sync.get('syncStatus');
    return result.syncStatus || 'synced';
  },

  async setLastSyncTime(time: number): Promise<void> {
    await chrome.storage.sync.set({ lastSyncTime: time });
  },

  async getLastSyncTime(): Promise<number> {
    const result = await chrome.storage.sync.get('lastSyncTime');
    return result.lastSyncTime || 0;
  },

  // Local storage (device-specific)
  async getAuthToken(): Promise<AuthToken | null> {
    const result = await chrome.storage.local.get('authToken');
    return result.authToken || null;
  },

  async setAuthToken(token: AuthToken | null): Promise<void> {
    if (token) {
      await chrome.storage.local.set({ authToken: token });
    } else {
      await chrome.storage.local.remove('authToken');
    }
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const result = await chrome.storage.local.get('syncQueue');
    return result.syncQueue || [];
  },

  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const queue = await this.getSyncQueue();
    queue.push(item);
    await chrome.storage.local.set({ syncQueue: queue });
  },

  async clearSyncQueue(): Promise<void> {
    await chrome.storage.local.remove('syncQueue');
  },

  async removeSyncQueueItem(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    await chrome.storage.local.set({ syncQueue: filtered });
  },

  async getOnlineStatus(): Promise<boolean> {
    const result = await chrome.storage.local.get('isOnline');
    return result.isOnline !== false; // default to online
  },

  async setOnlineStatus(isOnline: boolean): Promise<void> {
    await chrome.storage.local.set({ isOnline });
  },
};
```

- [ ] **Step 4: Commit**

```bash
git add extension/lib/types.ts extension/lib/messages.ts extension/lib/storage.ts
git commit -m "feat: add TypeScript types and storage utilities"
```

---

### Task 3: Create Supabase client factory

**Files:**
- Create: `extension/lib/supabase.ts`

**Interfaces:**
- Produces: `createSupabaseClient()` function that returns authenticated Supabase client
- Produces: `refreshToken()` function for token management
- Consumes: `AuthToken` type, `storage.getAuthToken()`, `storage.setAuthToken()`

**Steps:**

- [ ] **Step 1: Create supabase.ts**

```typescript
// extension/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { AuthToken } from './types';
import { storage } from './storage';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export async function createSupabaseClient() {
  const token = await storage.getAuthToken();

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // Don't use browser session storage
    },
  });

  if (token) {
    // Set existing session
    await client.auth.setSession({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
    });
  }

  // Listen for auth changes and store token
  const { data: { subscription } } = client.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user && session.access_token && session.refresh_token) {
        const newToken: AuthToken = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || Date.now() + 3600000,
        };
        await storage.setAuthToken(newToken);
      } else if (event === 'SIGNED_OUT') {
        await storage.setAuthToken(null);
      }
    }
  );

  return { client, subscription };
}

export async function getSupabaseClient() {
  const { client } = await createSupabaseClient();
  return client;
}

export async function signOut() {
  const client = await getSupabaseClient();
  await client.auth.signOut();
  await storage.setAuthToken(null);
}

export async function signInWithPassword(email: string, password: string) {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Update .env.local with Supabase credentials**

Add to `.env.local`:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 3: Install Supabase client**

```bash
npm install @supabase/supabase-js@^2.38.0
```

- [ ] **Step 4: Commit**

```bash
git add extension/lib/supabase.ts package.json
git commit -m "feat: add Supabase client factory"
```

---

### Task 4: Create extension manifest and popup HTML

**Files:**
- Create: `extension/manifest.json`
- Create: `extension/popup.html`
- Create: `tsconfig.extension.json`

**Interfaces:**
- Produces: Manifest V3 configuration
- Produces: Popup HTML shell (React injected into this)
- Consumes: None (bootstrap task)

**Steps:**

- [ ] **Step 1: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "czToDo",
  "version": "0.1.0",
  "description": "Manage your to-dos across all devices",
  "permissions": [
    "storage",
    "contextMenus",
    "scripting",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "czToDo",
    "default_icons": {
      "16": "assets/icons/icon-16.png",
      "48": "assets/icons/icon-48.png",
      "128": "assets/icons/icon-128.png"
    }
  },
  "background": {
    "service_worker": "dist/background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["dist/content.js"],
      "run_at": "document_start"
    }
  ],
  "icons": {
    "16": "assets/icons/icon-16.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  }
}
```

- [ ] **Step 2: Create popup.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>czToDo</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 400px;
      min-height: 500px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="dist/popup.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create tsconfig.extension.json**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "target": "ES2020",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["extension/**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create extension/assets/icons/**

For now, create placeholder 1x1 pixel PNGs:
```bash
mkdir -p extension/assets/icons
# Using imagemagick or online tool, create:
# - icon-16.png (16x16)
# - icon-48.png (48x48)
# - icon-128.png (128x128)
# For now, can be simple colored squares with text
```

Alternatively, use placeholder images (we'll update with proper icons later):
```bash
# Create temporary placeholder
echo "PNG placeholder for now" > extension/assets/icons/icon-16.png
echo "PNG placeholder for now" > extension/assets/icons/icon-48.png
echo "PNG placeholder for now" > extension/assets/icons/icon-128.png
```

- [ ] **Step 5: Commit**

```bash
git add extension/manifest.json extension/popup.html tsconfig.extension.json extension/assets/
git commit -m "feat: add extension manifest, popup HTML, and config"
```

---

### Task 5: Set up build toolchain (Webpack + TypeScript)

**Files:**
- Create: `webpack.extension.js`
- Modify: `package.json` (add build scripts and dependencies)

**Interfaces:**
- Produces: `npm run build:extension` and `npm run dev:extension` commands
- Produces: Compiled JS bundles in `extension/dist/`

**Steps:**

- [ ] **Step 1: Install build dependencies**

```bash
npm install --save-dev \
  webpack \
  webpack-cli \
  ts-loader \
  @types/chrome \
  dotenv-webpack
```

- [ ] **Step 2: Create webpack.extension.js**

```javascript
// webpack.extension.js

const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = [
  // Popup UI bundle
  {
    mode: 'development',
    entry: './extension/popup/index.tsx',
    output: {
      path: path.resolve(__dirname, 'extension', 'dist'),
      filename: 'popup.js',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new Dotenv({
        path: '.env.local',
      }),
    ],
  },
  // Background worker bundle
  {
    mode: 'development',
    entry: './extension/background/index.ts',
    output: {
      path: path.resolve(__dirname, 'extension', 'dist'),
      filename: 'background.js',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new Dotenv({
        path: '.env.local',
      }),
    ],
  },
  // Content script bundle
  {
    mode: 'development',
    entry: './extension/content/index.ts',
    output: {
      path: path.resolve(__dirname, 'extension', 'dist'),
      filename: 'content.js',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  },
];
```

- [ ] **Step 3: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "build:web": "next build",
    "build:extension": "webpack --config webpack.extension.js --mode production",
    "dev:extension": "webpack watch --config webpack.extension.js --mode development",
    "build": "npm run build:web && npm run build:extension"
  }
}
```

- [ ] **Step 4: Install style-loader and css-loader**

```bash
npm install --save-dev style-loader css-loader
```

- [ ] **Step 5: Commit**

```bash
git add webpack.extension.js package.json
git commit -m "chore: set up Webpack build for extension"
```

---

### Task 6: Create React popup entry point and main App component

**Files:**
- Create: `extension/popup/index.tsx`
- Create: `extension/popup/App.tsx`
- Create: `extension/popup/styles.css`

**Interfaces:**
- Consumes: `useAuth` hook, `useTodos` hook
- Produces: Renderable popup UI with tabs for todos/settings

**Steps:**

- [ ] **Step 1: Create popup/index.tsx (React entry)**

```typescript
// extension/popup/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 2: Create popup/App.tsx**

```typescript
// extension/popup/App.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTodos } from './hooks/useTodos';
import LoginForm from './components/LoginForm';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import SyncStatus from './components/SyncStatus';
import FilterBar from './components/FilterBar';

type FilterStatus = 'active' | 'completed' | 'archived' | 'all';

export default function App() {
  const { user, login, logout, isLoading: authLoading } = useAuth();
  const { todos, addTodo, updateTodo, deleteTodo, syncStatus } = useTodos();
  const [filter, setFilter] = useState<FilterStatus>('active');

  if (authLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    return todo.status === filter;
  });

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>czToDo</h1>
        <SyncStatus status={syncStatus} />
        <button 
          onClick={logout} 
          style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>

      <main className="popup-main">
        <TodoForm onAdd={addTodo} />
        <FilterBar 
          currentFilter={filter}
          onFilterChange={setFilter}
        />
        <TodoList
          todos={filteredTodos}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
        />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Create popup/styles.css**

```css
/* extension/popup/styles.css */

:root {
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-border: #e5e7eb;
  --color-bg: #ffffff;
  --color-text: #1f2937;
  --color-text-light: #6b7280;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1f2937;
    --color-text: #f3f4f6;
    --color-text-light: #d1d5db;
    --color-border: #374151;
  }
}

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  font-size: 14px;
  color: var(--color-text);
  background-color: var(--color-bg);
  margin: 0;
  padding: 0;
}

.popup-container {
  width: 400px;
  min-height: 500px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
}

.popup-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.popup-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.popup-main {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

button {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

button:hover {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

input,
textarea {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 14px;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
```

- [ ] **Step 4: Install React and ReactDOM (if not already installed)**

```bash
npm list react react-dom
# If not present:
npm install react@^18.0.0 react-dom@^18.0.0
npm install --save-dev @types/react @types/react-dom
```

- [ ] **Step 5: Commit**

```bash
git add extension/popup/index.tsx extension/popup/App.tsx extension/popup/styles.css
git commit -m "feat: create React popup entry point and main App component"
```

---

### Task 7: Create React hooks for authentication and todos

**Files:**
- Create: `extension/popup/hooks/useAuth.ts`
- Create: `extension/popup/hooks/useTodos.ts`

**Interfaces:**
- Consumes: `signInWithPassword`, `signUp`, `signOut` from lib/supabase
- Consumes: `storage` helpers
- Produces: `useAuth` hook returning `{ user, login, logout, isLoading }`
- Produces: `useTodos` hook returning `{ todos, addTodo, updateTodo, deleteTodo, syncStatus }`

**Steps:**

- [ ] **Step 1: Create hooks/useAuth.ts**

```typescript
// extension/popup/hooks/useAuth.ts

import { useEffect, useState } from 'react';
import { signInWithPassword, signUp, getSupabaseClient } from '../lib/supabase';

interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    async function checkAuth() {
      try {
        const client = await getSupabaseClient();
        const { data: { user } } = await client.auth.getUser();
        
        if (user) {
          setUser({
            id: user.id,
            email: user.email || '',
          });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function login(email: string, password: string, isSignUp = false) {
    try {
      setIsLoading(true);
      setError(null);

      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signInWithPassword(email, password);
      }

      // Fetch user info
      const client = await getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();
      
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      setIsLoading(true);
      const client = await getSupabaseClient();
      await client.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    user,
    login,
    logout,
    isLoading,
    error,
  };
}
```

- [ ] **Step 2: Create hooks/useTodos.ts**

```typescript
// extension/popup/hooks/useTodos.ts

import { useEffect, useState } from 'react';
import { storage } from '../lib/storage';
import { getSupabaseClient } from '../lib/supabase';
import type { Todo, ExtensionState } from '../lib/types';

interface UseTodosReturn {
  todos: Todo[];
  addTodo: (title: string, description?: string) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  syncStatus: ExtensionState['syncStatus'];
  isLoading: boolean;
}

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [syncStatus, setSyncStatus] = useState<ExtensionState['syncStatus']>('syncing');
  const [isLoading, setIsLoading] = useState(true);

  // Load todos from storage on mount
  useEffect(() => {
    async function loadTodos() {
      try {
        const stored = await storage.getTodos();
        setTodos(stored);
        
        const status = await storage.getSyncStatus();
        setSyncStatus(status);
      } catch (err) {
        console.error('Failed to load todos:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTodos();

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.todos) {
        setTodos(changes.todos.newValue || []);
      }
      if (area === 'sync' && changes.syncStatus) {
        setSyncStatus(changes.syncStatus.newValue || 'synced');
      }
    });
  }, []);

  async function addTodo(title: string, description?: string) {
    try {
      setSyncStatus('syncing');

      const client = await getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const newTodo: Todo = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title,
        description,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source_type: 'popup',
      };

      // Optimistic update
      const updated = [newTodo, ...todos];
      setTodos(updated);
      await storage.setTodos(updated);

      // Send to background worker for sync
      chrome.runtime.sendMessage({
        type: 'ADD_TODO',
        payload: newTodo,
      });

      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to add todo:', err);
      setSyncStatus('error');
    }
  }

  async function updateTodo(id: string, updates: Partial<Todo>) {
    try {
      setSyncStatus('syncing');

      const updated = todos.map(todo =>
        todo.id === id
          ? { ...todo, ...updates, updated_at: new Date().toISOString() }
          : todo
      );
      setTodos(updated);
      await storage.setTodos(updated);

      // Send to background worker for sync
      chrome.runtime.sendMessage({
        type: 'UPDATE_TODO',
        payload: { id, updates },
      });

      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to update todo:', err);
      setSyncStatus('error');
    }
  }

  async function deleteTodo(id: string) {
    try {
      setSyncStatus('syncing');

      const updated = todos.filter(todo => todo.id !== id);
      setTodos(updated);
      await storage.setTodos(updated);

      // Send to background worker for sync
      chrome.runtime.sendMessage({
        type: 'DELETE_TODO',
        payload: { id },
      });

      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to delete todo:', err);
      setSyncStatus('error');
    }
  }

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    syncStatus,
    isLoading,
  };
}
```

- [ ] **Step 3: Create hooks directory**

```bash
mkdir -p extension/popup/hooks
```

- [ ] **Step 4: Commit**

```bash
git add extension/popup/hooks/useAuth.ts extension/popup/hooks/useTodos.ts
git commit -m "feat: create React hooks for auth and todos"
```

---

### Task 8: Create popup React components

**Files:**
- Create: `extension/popup/components/LoginForm.tsx`
- Create: `extension/popup/components/TodoList.tsx`
- Create: `extension/popup/components/TodoForm.tsx`
- Create: `extension/popup/components/SyncStatus.tsx`
- Create: `extension/popup/components/FilterBar.tsx`

**Interfaces:**
- Consumes: `Todo` type, hook functions
- Produces: Reusable React components for popup UI

**Steps:**

- [ ] **Step 1: Create components/LoginForm.tsx**

```typescript
// extension/popup/components/LoginForm.tsx

import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string, password: string, isSignUp: boolean) => Promise<void>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      await onLogin(email, password, isSignUp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>czToDo</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div style={{ color: 'var(--color-error)', fontSize: '12px' }}>{error}</div>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
        </button>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'transparent', color: 'var(--color-primary)' }}
        >
          {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create components/TodoForm.tsx**

```typescript
// extension/popup/components/TodoForm.tsx

import React, { useState } from 'react';

interface TodoFormProps {
  onAdd: (title: string, description?: string) => Promise<void>;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsLoading(true);
      await onAdd(title, description);
      setTitle('');
      setDescription('');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        type="text"
        placeholder="Add a new to-do..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isLoading}
        style={{ fontSize: '14px' }}
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isLoading}
        rows={2}
        style={{ fontSize: '12px', resize: 'none' }}
      />
      <button type="submit" disabled={isLoading || !title.trim()}>
        {isLoading ? 'Adding...' : 'Add To-Do'}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create components/TodoList.tsx**

```typescript
// extension/popup/components/TodoList.tsx

import React from 'react';
import type { Todo } from '../lib/types';

interface TodoListProps {
  todos: Todo[];
  onUpdate: (id: string, updates: Partial<Todo>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TodoList({ todos, onUpdate, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-light)' }}>No to-dos yet</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {todos.map((todo) => (
        <div
          key={todo.id}
          style={{
            padding: '12px',
            border: `1px solid var(--color-border)`,
            borderRadius: '4px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            backgroundColor: todo.status === 'completed' ? 'var(--color-border)' : 'transparent',
          }}
        >
          <input
            type="checkbox"
            checked={todo.status === 'completed'}
            onChange={(e) =>
              onUpdate(todo.id, {
                status: e.target.checked ? 'completed' : 'active',
              })
            }
            style={{ marginTop: '4px', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                fontWeight: 500,
              }}
            >
              {todo.title}
            </div>
            {todo.description && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                {todo.description}
              </div>
            )}
            {todo.source_url && (
              <a
                href={todo.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '11px',
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  display: 'block',
                  marginTop: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {todo.source_url}
              </a>
            )}
          </div>
          <button
            onClick={() => onDelete(todo.id)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: 'var(--color-error)',
              color: 'white',
              border: 'none',
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create components/SyncStatus.tsx**

```typescript
// extension/popup/components/SyncStatus.tsx

import React from 'react';
import type { ExtensionState } from '../lib/types';

interface SyncStatusProps {
  status: ExtensionState['syncStatus'];
}

export default function SyncStatus({ status }: SyncStatusProps) {
  const statusText = {
    synced: '✓ Synced',
    syncing: '⟳ Syncing...',
    offline: '⚠ Offline',
    error: '✕ Error',
  };

  const statusColor = {
    synced: 'var(--color-success)',
    syncing: 'var(--color-primary)',
    offline: '#f59e0b',
    error: 'var(--color-error)',
  };

  return (
    <div
      style={{
        fontSize: '12px',
        color: statusColor[status],
        fontWeight: 500,
      }}
    >
      {statusText[status]}
    </div>
  );
}
```

- [ ] **Step 5: Create components/FilterBar.tsx**

```typescript
// extension/popup/components/FilterBar.tsx

import React from 'react';

type FilterStatus = 'active' | 'completed' | 'archived' | 'all';

interface FilterBarProps {
  currentFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
}

export default function FilterBar({ currentFilter, onFilterChange }: FilterBarProps) {
  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Archived', value: 'archived' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: currentFilter === filter.value ? 'var(--color-primary)' : 'var(--color-border)',
            color: currentFilter === filter.value ? 'white' : 'var(--color-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create components directory and commit**

```bash
mkdir -p extension/popup/components
git add extension/popup/components/
git commit -m "feat: create popup React components (login, todo list, form, sync status, filters)"
```

---

### Task 9: Create background worker (Service Worker) scaffold and sync logic

**Files:**
- Create: `extension/background/index.ts`
- Create: `extension/background/sync.ts`

**Interfaces:**
- Consumes: `storage`, `messages`, `Todo` type, Supabase client
- Produces: Service worker that listens for messages and syncs todos

**Steps:**

- [ ] **Step 1: Create background/sync.ts (sync queue and realtime listener)**

```typescript
// extension/background/sync.ts

import { getSupabaseClient } from '../lib/supabase';
import { storage } from '../lib/storage';
import { createResponse } from '../lib/messages';
import type { Todo, SyncQueueItem } from '../lib/types';

export class SyncManager {
  private isOnline = true;
  private isSyncing = false;

  async initialize() {
    // Monitor online/offline status
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Set initial online status
    this.isOnline = navigator.onLine;
    await storage.setOnlineStatus(this.isOnline);

    // Start realtime listener for todos
    await this.setupRealtimeListener();

    // Process sync queue periodically
    setInterval(() => this.processSyncQueue(), 5000);

    // Initial sync queue processing
    await this.processSyncQueue();
  }

  private async handleOnline() {
    this.isOnline = true;
    await storage.setOnlineStatus(true);
    await storage.setSyncStatus('syncing');
    await this.processSyncQueue();
  }

  private async handleOffline() {
    this.isOnline = false;
    await storage.setOnlineStatus(false);
    await storage.setSyncStatus('offline');
  }

  private async setupRealtimeListener() {
    try {
      const client = await getSupabaseClient();
      const { data: { user } } = await client.auth.getUser();

      if (!user) return;

      // Subscribe to realtime changes
      const channel = client
        .channel('todos')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'todos',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            await this.handleRealtimeUpdate(payload);
          }
        )
        .subscribe();

      // Store subscription for cleanup
      (window as any).todoChannel = channel;
    } catch (err) {
      console.error('Failed to setup realtime listener:', err);
    }
  }

  private async handleRealtimeUpdate(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const todos = await storage.getTodos();

    let updated = [...todos];

    if (eventType === 'INSERT') {
      updated = [newRecord, ...updated];
    } else if (eventType === 'UPDATE') {
      updated = updated.map(todo => (todo.id === newRecord.id ? newRecord : todo));
    } else if (eventType === 'DELETE') {
      updated = updated.filter(todo => todo.id !== oldRecord.id);
    }

    await storage.setTodos(updated);
    await storage.setSyncStatus('synced');
    await storage.setLastSyncTime(Date.now());
  }

  async addTodo(todo: Todo) {
    if (!this.isOnline) {
      // Queue for later
      await storage.addToSyncQueue({
        id: crypto.randomUUID(),
        action: 'insert',
        table: 'todos',
        data: todo,
        timestamp: Date.now(),
        retries: 0,
      });
      return;
    }

    try {
      await storage.setSyncStatus('syncing');
      const client = await getSupabaseClient();
      const { error } = await client.from('todos').insert([todo]);

      if (error) throw error;
      await storage.setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to add todo:', err);
      await storage.setSyncStatus('error');
      throw err;
    }
  }

  async updateTodo(id: string, updates: Partial<Todo>) {
    if (!this.isOnline) {
      await storage.addToSyncQueue({
        id: crypto.randomUUID(),
        action: 'update',
        table: 'todos',
        data: { id, ...updates },
        timestamp: Date.now(),
        retries: 0,
      });
      return;
    }

    try {
      await storage.setSyncStatus('syncing');
      const client = await getSupabaseClient();
      const { error } = await client
        .from('todos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await storage.setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to update todo:', err);
      await storage.setSyncStatus('error');
      throw err;
    }
  }

  async deleteTodo(id: string) {
    if (!this.isOnline) {
      await storage.addToSyncQueue({
        id: crypto.randomUUID(),
        action: 'delete',
        table: 'todos',
        data: { id },
        timestamp: Date.now(),
        retries: 0,
      });
      return;
    }

    try {
      await storage.setSyncStatus('syncing');
      const client = await getSupabaseClient();
      const { error } = await client.from('todos').delete().eq('id', id);

      if (error) throw error;
      await storage.setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to delete todo:', err);
      await storage.setSyncStatus('error');
      throw err;
    }
  }

  private async processSyncQueue() {
    if (this.isSyncing || !this.isOnline) return;

    try {
      this.isSyncing = true;
      const queue = await storage.getSyncQueue();

      if (queue.length === 0) return;

      const client = await getSupabaseClient();

      for (const item of queue) {
        try {
          if (item.action === 'insert') {
            await client.from('todos').insert([item.data]);
          } else if (item.action === 'update') {
            const { id, ...updates } = item.data;
            await client.from('todos').update(updates).eq('id', id);
          } else if (item.action === 'delete') {
            await client.from('todos').delete().eq('id', item.data.id);
          }

          await storage.removeSyncQueueItem(item.id);
        } catch (err) {
          console.error(`Failed to sync queue item ${item.id}:`, err);
          item.retries += 1;
          if (item.retries > 3) {
            await storage.removeSyncQueueItem(item.id);
          }
        }
      }

      await storage.setSyncStatus('synced');
    } finally {
      this.isSyncing = false;
    }
  }
}
```

- [ ] **Step 2: Create background/index.ts (Service Worker entry)**

```typescript
// extension/background/index.ts

import { SyncManager } from './sync';
import { createResponse } from '../lib/messages';
import type { Message } from '../lib/messages';
import type { Todo } from '../lib/types';

const syncManager = new SyncManager();

// Initialize on service worker start
syncManager.initialize().catch(err => console.error('Failed to initialize sync manager:', err));

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(err => sendResponse(createResponse(false, undefined, err.message)));
  
  // Return true to indicate we'll send response asynchronously
  return true;
});

async function handleMessage(message: Message, sender: chrome.runtime.MessageSender) {
  console.log('Background received message:', message.type);

  switch (message.type) {
    case 'ADD_TODO': {
      const todo = message.payload as Todo;
      await syncManager.addTodo(todo);
      return createResponse(true, { success: true });
    }

    case 'UPDATE_TODO': {
      const { id, updates } = message.payload;
      await syncManager.updateTodo(id, updates);
      return createResponse(true, { success: true });
    }

    case 'DELETE_TODO': {
      const { id } = message.payload;
      await syncManager.deleteTodo(id);
      return createResponse(true, { success: true });
    }

    case 'CAPTURE_TEXT': {
      // Handle text capture from content script
      const { text, url, favicon } = message.payload;
      const todo: Todo = {
        id: crypto.randomUUID(),
        user_id: '', // Will be set by sync manager
        title: text,
        source_url: url,
        source_type: 'context_menu',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
      };
      await syncManager.addTodo(todo);
      return createResponse(true, { success: true });
    }

    case 'GITHUB_ISSUE': {
      // Handle GitHub issue capture
      const { title, url, number, assignee, labels } = message.payload;
      const todo: Todo = {
        id: crypto.randomUUID(),
        user_id: '', // Will be set by sync manager
        title,
        source_url: url,
        source_type: 'github',
        github_issue_id: number,
        tags: labels || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
      };
      await syncManager.addTodo(todo);
      return createResponse(true, { success: true });
    }

    default:
      return createResponse(false, undefined, `Unknown message type: ${message.type}`);
  }
}

// Periodic sync check (every 5 minutes)
chrome.alarms.create('syncCheck', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncCheck') {
    console.log('Periodic sync check triggered');
  }
});
```

- [ ] **Step 3: Create background directory and commit**

```bash
mkdir -p extension/background
git add extension/background/index.ts extension/background/sync.ts
git commit -m "feat: create background worker with sync queue and realtime listener"
```

---

### Task 10: Create minimal content script scaffold

**Files:**
- Create: `extension/content/index.ts`

**Interfaces:**
- Consumes: `messages` types
- Produces: Content script that listens for context menu clicks

**Steps:**

- [ ] **Step 1: Create content/index.ts**

```typescript
// extension/content/index.ts

import { createMessage } from '../lib/messages';

// Listen for messages from background worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONTEXT_MENU_CLICK') {
    handleContextMenuClick(message.payload);
  }
});

function handleContextMenuClick(payload: any) {
  const { selectionText, pageUrl } = payload;

  if (selectionText) {
    // Capture selected text and create to-do
    chrome.runtime.sendMessage({
      type: 'CAPTURE_TEXT',
      payload: {
        text: selectionText,
        url: pageUrl,
        favicon: getFaviconUrl(),
      },
    });
  }
}

function getFaviconUrl(): string {
  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (link?.href) return link.href;
  return new URL('/favicon.ico', window.location.origin).href;
}

console.log('czToDo content script loaded');
```

- [ ] **Step 2: Create content directory and commit**

```bash
mkdir -p extension/content
git add extension/content/index.ts
git commit -m "feat: create minimal content script scaffold"
```

---

### Task 11: Test build and verify extension structure

**Files:**
- (No new files, testing existing setup)

**Interfaces:**
- Consumes: All extension files created so far
- Produces: `extension/dist/` folder with compiled bundles

**Steps:**

- [ ] **Step 1: Run build command**

```bash
npm run build:extension
```

Expected output:
```
webpack 5.x.x compiled with ... warning(s) and 0 error(s) in Xms
```

- [ ] **Step 2: Verify dist folder structure**

```bash
ls -la extension/dist/
# Should output:
# -rw-r--r--  popup.js
# -rw-r--r--  background.js
# -rw-r--r--  content.js
```

- [ ] **Step 3: Check manifest.json is in place**

```bash
ls -la extension/manifest.json
# Should exist
```

- [ ] **Step 4: Verify popup.html exists**

```bash
ls -la extension/popup.html
# Should exist
```

- [ ] **Step 5: Commit (if all checks pass)**

```bash
git add extension/dist/ .gitignore
git commit -m "chore: build extension bundles for first time"
```

Note: Add `extension/dist/` to `.gitignore` if not already there.

---

### Task 12: Manual testing - Load extension in Chrome

**Files:**
- (No new files, testing)

**Steps:**

- [ ] **Step 1: Open Chrome extensions page**

Navigate to: `chrome://extensions/`

- [ ] **Step 2: Enable Developer Mode**

Toggle "Developer mode" in top right corner

- [ ] **Step 3: Load unpacked extension**

Click "Load unpacked" → select `extension/` folder

- [ ] **Step 4: Verify extension appears**

You should see "czToDo" extension in the list with version 0.1.0

- [ ] **Step 5: Click extension icon**

Should open a popup window showing either:
- Login form (if not authenticated), or
- Empty to-do list (if authenticated)

- [ ] **Step 6: Test login**

Enter test email/password from Supabase Auth, click "Login" or "Sign Up"

- [ ] **Step 7: Verify popup loads**

After login, should see:
- Empty to-do list
- "Add a to-do..." form
- Filter buttons (Active, Completed, All)
- Sync status indicator (should show "✓ Synced")

- [ ] **Step 8: Verify console logs (optional)**

Open Chrome DevTools for extension:
- Right-click extension icon → "Inspect"
- Check console for "czToDo content script loaded"

- [ ] **Step 9: Document findings**

If any errors:
1. Check browser console for error messages
2. Note the error and add to `.omc/handoffs/` for debugging

---

**Phase 1 Complete!** ✅

Deliverable: Functional popup that authenticates with Supabase and displays (empty) to-do list.

---

## Phase 2: Context Menu & Text Capture

### Task 13: Set up context menu in background worker

**Files:**
- Modify: `extension/background/index.ts` (add context menu setup)

**Interfaces:**
- Consumes: Chrome context menus API
- Produces: Right-click context menu items

**Steps:**

- [ ] **Step 1: Add context menu setup to background/index.ts**

Add this after `syncManager.initialize()`:

```typescript
// Setup context menus
chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: 'add-todo',
    title: 'Add "%s" to czToDo',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'add-page',
    title: 'Add page to czToDo',
    contexts: ['page'],
  });
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab?.id === undefined) return;

  if (info.menuItemId === 'add-todo' && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'CONTEXT_MENU_CLICK',
      payload: {
        selectionText: info.selectionText,
        pageUrl: tab.url || '',
      },
    });
  } else if (info.menuItemId === 'add-page') {
    // Add entire page as todo
    const todo: Todo = {
      id: crypto.randomUUID(),
      user_id: '',
      title: tab.title || tab.url || 'Untitled',
      source_url: tab.url,
      source_type: 'context_menu',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
    };
    syncManager.addTodo(todo);
  }
});
```

- [ ] **Step 2: Add `contextMenus` permission to manifest.json**

In `extension/manifest.json`, update permissions:

```json
{
  "permissions": ["storage", "contextMenus", "scripting", "activeTab"]
}
```

- [ ] **Step 3: Rebuild and test**

```bash
npm run build:extension
```

Reload extension in Chrome (click refresh icon on extension page).

Right-click on any text → should see "Add '...' to czToDo" menu item.

- [ ] **Step 4: Commit**

```bash
git add extension/background/index.ts extension/manifest.json
git commit -m "feat: add context menu integration to background worker"
```

---

### Task 14: Enhance content script for text capture and messaging

**Files:**
- Modify: `extension/content/index.ts`

**Interfaces:**
- Consumes: Context menu click messages from background
- Produces: Send CAPTURE_TEXT messages back to background

**Steps:**

- [ ] **Step 1: Replace extension/content/index.ts with enhanced version**

```typescript
// extension/content/index.ts

import { createMessage } from '../lib/messages';

// Listen for messages from background worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received:', message.type);

  if (message.type === 'CONTEXT_MENU_CLICK') {
    handleContextMenuClick(message.payload).then(sendResponse);
    return true; // Indicate async response
  }
});

async function handleContextMenuClick(payload: any) {
  const { selectionText, pageUrl } = payload;

  if (!selectionText) {
    return { success: false, error: 'No text selected' };
  }

  try {
    const favicon = getFaviconUrl();
    const pageTitle = document.title || pageUrl;

    // Create todo from selection
    const response = await chrome.runtime.sendMessage({
      type: 'CAPTURE_TEXT',
      payload: {
        text: selectionText,
        url: pageUrl,
        pageTitle,
        favicon,
      },
    });

    console.log('Capture text response:', response);
    return response;
  } catch (err) {
    console.error('Failed to capture text:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function getFaviconUrl(): string {
  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (link?.href) {
    return link.href;
  }

  // Fallback to favicon.ico
  return new URL('/favicon.ico', window.location.origin).href;
}

// Log when content script loads
console.log('czToDo content script initialized on:', window.location.href);
```

- [ ] **Step 2: Update background worker to handle CAPTURE_TEXT**

In `extension/background/index.ts`, ensure the CAPTURE_TEXT handler includes:

```typescript
case 'CAPTURE_TEXT': {
  const { text, url, pageTitle, favicon } = message.payload;
  const { data: { user } } = await client.auth.getUser();
  
  const todo: Todo = {
    id: crypto.randomUUID(),
    user_id: user?.id || '',
    title: text,
    description: `From: ${pageTitle}`,
    source_url: url,
    source_type: 'context_menu',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'active',
  };
  
  await syncManager.addTodo(todo);
  return createResponse(true, { success: true });
}
```

- [ ] **Step 3: Rebuild and test**

```bash
npm run build:extension
# Reload extension in Chrome
```

Test: Select text on any web page → right-click → "Add '...' to czToDo" → check popup for new todo.

- [ ] **Step 4: Commit**

```bash
git add extension/content/index.ts extension/background/index.ts
git commit -m "feat: enhance content script for text capture and messaging"
```

---

**Phase 2 Complete!** ✅

Deliverable: Context menu works on any web page, text can be captured as to-dos.

---

## Phase 3: GitHub Integration

### Task 15: Create GitHub detection and injection system

**Files:**
- Create: `extension/content/github.ts`
- Modify: `extension/content/index.ts` (add GitHub detection)

**Interfaces:**
- Produces: GitHub issue/PR detection and button injection

**Steps:**

- [ ] **Step 1: Create extension/content/github.ts**

```typescript
// extension/content/github.ts

export function detectGitHubIssue(): GitHubIssueData | null {
  const url = window.location.href;

  // Match GitHub issue/PR URLs
  const issueMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/);
  if (!issueMatch) return null;

  const [, owner, repo, type, number] = issueMatch;

  // Parse page title for issue title
  const title = parseIssueTitle();
  if (!title) return null;

  // Try to find assignee from page
  const assignee = parseAssignee();

  // Parse labels
  const labels = parseLabels();

  return {
    type: type === 'issues' ? 'issue' : 'pr',
    title,
    number: parseInt(number),
    owner,
    repo,
    url,
    assignee,
    labels,
  };
}

interface GitHubIssueData {
  type: 'issue' | 'pr';
  title: string;
  number: number;
  owner: string;
  repo: string;
  url: string;
  assignee?: string;
  labels: string[];
}

function parseIssueTitle(): string | null {
  // Try to find title from page elements
  const titleEl = document.querySelector('[data-test-selector="issue-title"]');
  if (titleEl) return titleEl.textContent?.trim() || null;

  // Fallback: try common selectors
  const prTitle = document.querySelector('.js-issue-title, .gh-header-title, h1');
  return prTitle?.textContent?.trim() || null;
}

function parseAssignee(): string | undefined {
  // Look for assignee in sidebar
  const assigneeEl = document.querySelector('[data-test-selector="issue-assignees"] a, .sidebar-assignee a');
  return assigneeEl?.textContent?.trim() || undefined;
}

function parseLabels(): string[] {
  const labels: string[] = [];
  document.querySelectorAll('[data-test-selector="issue-labels"] a, .labels a').forEach(el => {
    const label = el.textContent?.trim();
    if (label) labels.push(label);
  });
  return labels;
}

export function injectAddButton() {
  // Check if button already exists
  if (document.getElementById('cztodo-add-btn')) return;

  // Find where to inject (top of issue header)
  const headerActions = document.querySelector('.gh-header-actions, [data-test-selector="issue-header-actions"]');
  if (!headerActions) return;

  const btn = document.createElement('button');
  btn.id = 'cztodo-add-btn';
  btn.textContent = '+ Add to czToDo';
  btn.style.cssText = `
    padding: 6px 12px;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    margin-left: 8px;
  `;

  btn.addEventListener('click', async () => {
    const issueData = detectGitHubIssue();
    if (!issueData) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GITHUB_ISSUE',
        payload: {
          title: issueData.title,
          url: issueData.url,
          number: issueData.number,
          assignee: issueData.assignee,
          labels: issueData.labels,
        },
      });

      if (response.success) {
        // Show confirmation
        const originalText = btn.textContent;
        btn.textContent = '✓ Added';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to add GitHub issue:', err);
      alert('Failed to add GitHub issue to czToDo');
    }
  });

  headerActions.appendChild(btn);
}

export function setupGitHubIntegration() {
  const issueData = detectGitHubIssue();
  if (!issueData) return;

  // Initial injection
  injectAddButton();

  // Re-inject button after page updates (GitHub uses TURBO or similar)
  const observer = new MutationObserver(() => {
    if (!document.getElementById('cztodo-add-btn')) {
      injectAddButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
```

- [ ] **Step 2: Update extension/content/index.ts to call GitHub setup**

Replace the bottom of `extension/content/index.ts` with:

```typescript
import { setupGitHubIntegration } from './github';

// ... existing code ...

// Log when content script loads
console.log('czToDo content script initialized on:', window.location.href);

// Setup GitHub integration if on GitHub
setupGitHubIntegration();
```

- [ ] **Step 3: Create content directory structure**

```bash
mkdir -p extension/content
# Files already created, just adding github.ts
```

- [ ] **Step 4: Rebuild and test**

```bash
npm run build:extension
```

Navigate to a GitHub issue:
- Should see "+ Add to czToDo" button in header
- Click it → should create a to-do with issue link

- [ ] **Step 5: Commit**

```bash
git add extension/content/github.ts extension/content/index.ts
git commit -m "feat: add GitHub issue detection and injection system"
```

---

### Task 16: Add auto-sync for assigned GitHub issues (Phase 3 advanced feature)

**Files:**
- Create: `extension/background/github.ts`
- Modify: `extension/background/index.ts` (add GitHub sync)

**Interfaces:**
- Produces: Periodic sync of assigned GitHub issues

**Steps:**

- [ ] **Step 1: Create extension/background/github.ts**

```typescript
// extension/background/github.ts

import { storage } from '../lib/storage';
import type { Todo } from '../lib/types';

export async function syncAssignedGitHubIssues(githubToken: string) {
  if (!githubToken) {
    console.log('No GitHub token configured, skipping GitHub sync');
    return;
  }

  try {
    // Fetch assigned issues from GitHub API
    const response = await fetch('https://api.github.com/user/issues', {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) throw new Error('GitHub API request failed');

    const issues = await response.json();

    // Convert to todos
    const todos: Todo[] = issues
      .filter((issue: any) => issue.pull_request === undefined) // Only issues, not PRs
      .map((issue: any) => ({
        id: `github-${issue.id}`,
        user_id: '',
        title: issue.title,
        source_url: issue.html_url,
        source_type: 'github' as const,
        github_issue_id: `${issue.repository.full_name}#${issue.number}`,
        tags: issue.labels.map((label: any) => label.name),
        created_at: new Date(issue.created_at).toISOString(),
        updated_at: new Date(issue.updated_at).toISOString(),
        status: 'active' as const,
      }));

    // Store in extension state (later: sync to Supabase)
    console.log(`Synced ${todos.length} assigned GitHub issues`);
  } catch (err) {
    console.error('Failed to sync GitHub issues:', err);
  }
}
```

- [ ] **Step 2: Add to background/index.ts (optional for Phase 1)**

For now, we'll skip this as it requires GitHub token setup. This can be added in Phase 4 (Settings).

---

**Phase 3 Complete!** ✅

Deliverable: GitHub issues can be added as to-dos via button injection on issue pages.

---

## Phase 4: Polish & Extended Integrations

### Task 17: Create settings/options page (placeholder for Phase 4)

This task is deferred to Phase 4. For now, the extension is fully functional for:
- ✅ Popup UI with to-do management
- ✅ Supabase sync across devices
- ✅ Context menu text capture
- ✅ GitHub issue integration

**Phase 4 roadmap:**
- [ ] Settings page (GitHub token, notification preferences)
- [ ] Email integration
- [ ] Slack integration
- [ ] UI polish (dark mode, animations)
- [ ] Performance optimization

---

## Summary

This implementation plan covers **Phases 1-3** of the Chrome extension build:

**Phase 1:** Core popup + Supabase sync (Tasks 1-12)
- Database schema and migrations
- TypeScript types and utilities
- Supabase client setup
- Manifest, webpack config, build toolchain
- React popup UI with components and hooks
- Background worker with realtime sync and offline queue

**Phase 2:** Context menu & text capture (Tasks 13-14)
- Context menu creation and click handling
- Text selection capture and messaging

**Phase 3:** GitHub integration (Tasks 15-16)
- GitHub issue detection and button injection
- Auto-create to-dos from GitHub issues

**Total Tasks:** 17 (implementation) + ongoing testing + Phase 4 features

Each task is independently testable and produces committed, working code. Follow the steps in order for best results.

---

## Verification Checklist

Before moving to Phase 4, verify:

- [ ] Extension loads in Chrome without errors
- [ ] Login/signup works with Supabase Auth
- [ ] Can add to-dos from popup
- [ ] To-do appears in popup after adding
- [ ] Can edit/delete to-dos in popup
- [ ] Sync status indicator shows correct status
- [ ] Context menu appears on web pages
- [ ] Text capture creates to-do with URL
- [ ] GitHub issue button appears on GitHub.com issues
- [ ] GitHub issue button creates to-do with link
- [ ] To-dos sync across multiple Chrome windows/tabs
- [ ] Offline changes queue and sync when online
- [ ] No console errors in extension background page
- [ ] No console errors in content scripts
