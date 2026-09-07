# czToDo Chrome Extension — Architecture & Design Spec

**Date:** 2026-09-07  
**Status:** Approved  
**Author:** Claude  
**Approach:** Supabase + Custom Sync API (Approach 2)

---

## 1. Executive Summary

Convert czToDo from a Next.js web app to a **Chrome extension** that syncs across devices. The extension will include:
- **Popup UI:** React-based to-do manager (click the extension icon)
- **Background worker:** Handles Supabase sync, offline queuing, and scheduled tasks
- **Content scripts:** Context menus, text selection capture, GitHub integration
- **Backend:** Supabase (PostgreSQL + realtime) for data persistence and cross-device sync
- **Build:** Parallel feature development (popup, background, content scripts built together)

---

## 2. Architecture Overview

### 2.1 High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│            Chrome Extension (czToDo)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │   POPUP UI       │  │   BACKGROUND WORKER          │ │
│  │ (React)          │  │ (Service Worker)             │ │
│  │                  │  │                              │ │
│  │ • List to-dos    │  │ • Supabase listener          │ │
│  │ • Add/edit/del   │  │ • Offline sync queue         │ │
│  │ • Quick add form │  │ • Context menu manager       │ │
│  │ • Sync status    │  │ • Scheduled tasks            │ │
│  │ • Login/logout   │  │ • Tab/page listeners         │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│           ▲                           ▲                  │
│           │ chrome.storage.sync       │                  │
│           └───────────────┬───────────┘                  │
│                           │                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ CONTENT SCRIPTS (injected into web pages)        │   │
│  │                                                  │   │
│  │ • Context menu: "Add to czToDo"                 │   │
│  │ • Text selection capture                         │   │
│  │ • GitHub integration (issues/PRs)                │   │
│  │ • Page URL + selection storage                   │   │
│  └──────────────────────────────────────────────────┘   │
│                           ▲                              │
│                           │ Message passing              │
│                           ▼                              │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            ▼
                ┌────────────────────────┐
                │   SUPABASE             │
                │                        │
                │ • PostgreSQL DB        │
                │ • Realtime API         │
                │ • Auth service         │
                │ • Row-level security   │
                └────────────────────────┘
```

### 2.2 Data Flow

**User adds a to-do from popup:**
1. Popup form submission → dispatch to background worker
2. Background worker queues change (offline support)
3. Background worker calls Supabase API
4. Supabase broadcasts realtime update → background listener
5. Listener updates `chrome.storage.sync`
6. Popup re-renders with new to-do
7. Change syncs to all user's devices

**User captures text from web page:**
1. User selects text on web page → context menu appears
2. User clicks "Add to czToDo" → content script captures selection + URL
3. Content script sends message to background worker
4. Background worker → Supabase → all devices sync
5. Popup refreshes (or shows sync indicator)

**Offline scenario:**
1. User adds to-do while offline
2. Background worker stores in local queue + `chrome.storage.sync`
3. When online, background worker auto-syncs queued changes
4. Supabase confirms → local queue clears

---

## 3. Extension Components

### 3.1 Popup UI

**Technology:** React component, Tailwind CSS, inline into `popup.html`

**Features:**
- Display all user's to-dos (paginated or virtual scrolling for many items)
- Filter/sort by status (active, completed, archived)
- Quick add form at top ("Add a to-do...")
- Inline edit/delete buttons per to-do
- Sync status indicator (✓ synced, ⟳ syncing, ⚠ offline)
- Login/logout button (if not authenticated)
- Settings link (future: notification preferences, GitHub settings, etc.)

**State Management:**
- Read from `chrome.storage.sync` for local cache
- Listen to Supabase realtime changes
- Show loading states during sync
- Optimistic updates (show change immediately, revert if sync fails)

**Authentication:**
- Check `chrome.storage.local` for Supabase auth token on load
- If no token, show login form (Supabase Auth UI)
- Store token after login (refresh token handled by Supabase client)

**Build Output:**
```
popup.html → includes bundled React app (CSS inlined)
```

### 3.2 Background Worker (Service Worker)

**Technology:** Chrome Service Worker (V3 Manifest)

**Responsibilities:**

1. **Supabase Connection:**
   - Initialize Supabase client with user's auth token (from storage)
   - Subscribe to realtime changes on user's to-do table
   - Handle auth token refresh

2. **Sync Queue (Offline Support):**
   - Store pending changes in `chrome.storage.local` queue
   - When offline detected, stop trying to sync
   - When online, process queue in order (FIFO)
   - Update `chrome.storage.sync` after each successful sync

3. **Context Menu Setup:**
   - Create context menu items on startup:
     - "Add to czToDo" (on any element)
     - "Add selection to czToDo" (when text selected)
   - Listen for context menu clicks → content script injection

4. **GitHub Integration:**
   - Detect GitHub pages (issues, PRs)
   - Inject "Add to czToDo" buttons if user visits GitHub
   - Parse issue/PR data and auto-create structured to-do

5. **Scheduled Tasks:**
   - Periodic sync check (every 5 min): ensure realtime is connected
   - Clean up old archived to-dos (optional retention policy)
   - Refresh auth token before expiry

6. **Message Passing:**
   - Listen for messages from content scripts
   - Listen for messages from popup (user actions)
   - Route commands to Supabase or local storage

**Error Handling:**
- If Supabase connection fails, queue locally and retry with exponential backoff
- If auth token expired, trigger re-login flow
- If sync queue grows too large, show warning to user

### 3.3 Content Scripts

**Technology:** Vanilla JS (no build step, injected at runtime)

**Manifest Injection:**
- Match patterns: `<all_urls>` or specific domains (configurable)
- Inject into `document_start` for early availability

**Features:**

1. **Context Menu Handler:**
   - Listen for context menu clicks (via background worker message)
   - Capture clicked element text + page URL
   - Send to background worker → Supabase

2. **Text Selection Capture:**
   - On text select + context menu interaction:
     - Capture selected text
     - Capture page URL + title
     - Capture favicon URL (for visual reference)
     - Create to-do: `"<selected text>" — <page URL>`

3. **GitHub Integration:**
   - Detect GitHub issue/PR pages (regex on URL)
   - Parse issue title, number, assignee, labels from DOM
   - Inject "Add to czToDo" button near "Open" button
   - On click, send structured data to background worker:
     ```json
     {
       "type": "github_issue",
       "title": "Fix login bug",
       "url": "https://github.com/...",
       "number": 123,
       "assignee": "username",
       "labels": ["bug", "high-priority"]
     }
     ```
   - Create to-do with link back to GitHub

4. **Other Integrations (Phase 1):**
   - Gmail: "Add email to czToDo" button
   - Notion: "Link to Notion page" button
   - Slack: Right-click on thread → create to-do
   - Generic: Always offer "Add <selection> to czToDo"

**Communication:**
- Send messages to background worker via `chrome.runtime.sendMessage()`
- Receive responses for confirmation/error handling
- No direct Supabase connection (route through background worker)

---

## 4. Data Schema (Supabase)

### 4.1 Tables

**`users` (managed by Supabase Auth)**
```sql
id (UUID, primary key)
email (string)
created_at (timestamp)
```

**`todos` (custom table)**
```sql
id (UUID, primary key)
user_id (UUID, foreign key → users.id)
title (text)
description (text, nullable)
status (enum: 'active', 'completed', 'archived')
priority (enum: 'low', 'medium', 'high', nullable)
source_url (text, nullable) — URL where to-do was created
source_type (enum: 'popup', 'context_menu', 'github', 'email', nullable)
github_issue_id (text, nullable) — e.g., "owner/repo#123"
created_at (timestamp)
updated_at (timestamp)
due_date (date, nullable)
tags (array of strings, nullable)
row_level_security: enabled for user_id
```

### 4.2 Row-Level Security (RLS)

- Users can only read/write their own to-dos
- Policy: `user_id = auth.uid()`

### 4.3 Indexes

- `todos(user_id, status)` — for fast filtering
- `todos(user_id, created_at desc)` — for recent to-dos
- `todos(user_id, updated_at desc)` — for sync ordering

---

## 5. Authentication & Security

### 5.1 Supabase Auth

- **Method:** Email + password (or OAuth if preferred)
- **Token Storage:** `chrome.storage.local` (secure, isolated per extension)
- **Token Refresh:** Supabase client handles automatically
- **Logout:** Clear token from storage, disconnect Supabase listener

### 5.2 Communication Security

- All Supabase communication: HTTPS only
- Browser extension isolation: content scripts cannot access popup data directly (message passing only)
- Content scripts cannot access auth tokens (background worker proxies requests)

### 5.3 Data Privacy

- Row-level security enforced at DB level
- Users cannot access other users' to-dos
- Offline queue stored locally (not synced to server)

---

## 6. Build & Deployment

### 6.1 Project Structure

```
czToDo/
├── extension/
│   ├── manifest.json              # Chrome extension manifest (V3)
│   ├── popup.html                 # Popup shell (React injected)
│   ├── popup/
│   │   ├── App.tsx               # Popup React component
│   │   ├── components/           # Shared popup components
│   │   └── styles.css            # Tailwind output
│   ├── background/
│   │   ├── index.ts              # Service worker entry
│   │   ├── supabase.ts           # Supabase client init
│   │   ├── sync.ts               # Sync queue logic
│   │   ├── context-menu.ts       # Context menu handlers
│   │   └── github.ts             # GitHub integration
│   ├── content/
│   │   ├── index.ts              # Content script entry
│   │   ├── context-menu.ts       # Context menu listeners
│   │   ├── text-capture.ts       # Text selection handler
│   │   └── github.ts             # GitHub DOM parsing
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client factory
│   │   ├── storage.ts            # chrome.storage helpers
│   │   ├── messages.ts           # Message passing types
│   │   └── types.ts              # Shared TypeScript types
│   └── assets/
│       ├── icons/                # Extension icons (16, 48, 128)
│       └── styles.css            # Global styles
│
├── package.json                  # Updated with build scripts
├── tsconfig.json
├── tsconfig.extension.json       # Extension-specific TS config
├── webpack.extension.js          # Extension build config
├── supabase/
│   ├── migrations/              # Database migrations
│   └── seed.sql                 # Seed data (optional)
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-09-07-chrome-extension-design.md (this file)
```

### 6.2 Build Scripts

In `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build:web": "next build",
    "build:extension": "webpack --config webpack.extension.js",
    "build": "npm run build:web && npm run build:extension",
    "dev:extension": "webpack watch --config webpack.extension.js",
    "zip:extension": "cd extension && zip -r czToDo-extension.zip manifest.json popup.html dist/ assets/"
  }
}
```

### 6.3 Build Process

1. **Popup UI:**
   - Bundle React + Tailwind via Webpack
   - Inline CSS into `popup.html`
   - Output: `extension/dist/popup.js`

2. **Background Worker:**
   - Transpile TypeScript
   - Polyfill for Chrome APIs
   - Output: `extension/dist/background.js`

3. **Content Scripts:**
   - Transpile TypeScript
   - Keep minimal (no React)
   - Output: `extension/dist/content.js`

4. **Manifest:**
   - Copy `manifest.json` to `extension/`
   - Version field auto-updated from `package.json`

5. **Assets:**
   - Copy icons, images to `extension/assets/`

### 6.4 Extension Installation

1. Build: `npm run build:extension`
2. Open Chrome: `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select `extension/` folder
5. Extension appears in toolbar

### 6.5 Distribution (Future)

- Zip and submit to Chrome Web Store
- Script: `npm run zip:extension`

---

## 7. Implementation Phases

### Phase 1: Core Popup + Sync
- [ ] Set up Supabase project and tables
- [ ] Build popup UI (React component, list + add form)
- [ ] Build background worker (Supabase connection, realtime listener)
- [ ] Implement offline queue + sync logic
- [ ] Test popup + sync across devices
- [ ] Migrate existing to-dos to Supabase

**Deliverable:** Functional popup that syncs across devices

---

### Phase 2: Context Menu & Text Capture
- [ ] Set up content scripts and context menu
- [ ] Implement text selection capture
- [ ] Add page URL + favicon to to-do metadata
- [ ] Test on multiple websites

**Deliverable:** Right-click "Add to czToDo" works on any web page

---

### Phase 3: GitHub Integration
- [ ] Detect GitHub issue/PR pages
- [ ] Parse issue/PR metadata from DOM
- [ ] Inject "Add to czToDo" button
- [ ] Implement auto-sync of assigned issues
- [ ] Create to-dos with GitHub links

**Deliverable:** Seamless GitHub → to-do flow

---

### Phase 4: Polish & Extended Integrations
- [ ] Settings page (notification preferences, GitHub token, etc.)
- [ ] Email integration
- [ ] Slack integration
- [ ] Better UI/UX (dark mode, animations, etc.)
- [ ] Performance optimization

**Deliverable:** Polished extension ready for distribution

---

## 8. Technology Stack Summary

| Component | Technology | Why |
|-----------|-----------|-----|
| Popup UI | React 18 + TypeScript + Tailwind | Familiar stack, reuse CSS |
| Background | Chrome Service Worker (V3) | Modern, reliable, native API |
| Content Scripts | Vanilla TS (no React) | Lightweight, no hydration overhead |
| Database | Supabase (PostgreSQL) | Managed, realtime, affordable, open-source |
| Auth | Supabase Auth | Integrated, handles token refresh |
| Build | Webpack + TypeScript | Flexible, familiar toolchain |
| Storage | `chrome.storage` (sync + local) | Built-in, cross-device support |

---

## 9. Success Criteria

- ✅ Popup displays to-dos synced from Supabase
- ✅ Adding a to-do from popup syncs to all devices in <2s
- ✅ Context menu works on any web page
- ✅ Text selection capture includes URL + favicon
- ✅ GitHub issues can be added as to-dos
- ✅ Offline changes queue and sync when online
- ✅ Authentication works (Supabase Auth)
- ✅ No data loss or corruption
- ✅ Extension passes Chrome security review

---

## 10. Notes & Risks

- **Manifest V3:** Modern but has limitations (no persistent background pages). Service Workers can be terminated. Mitigate with alarms + periodic checks.
- **Supabase realtime:** May have brief delays (typically <1s). Show sync indicator to user.
- **GitHub parsing:** GitHub's DOM structure may change. Use selectors that are stable (e.g., data attributes where possible).
- **Data migration:** Moving from Prisma to Supabase requires careful migration script. Test extensively.
- **Cross-device sync:** User must be logged into same account on all devices. Document clearly.

---

**Document Status:** Ready for implementation planning.
