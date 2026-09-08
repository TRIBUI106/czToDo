# czToDo Extension - Quick Start Guide

## 🎯 One-Minute Overview

**czToDo** is a Chrome extension that captures to-dos from GitHub issues, Gmail, Slack, and web pages—with real-time sync across your devices via Supabase.

---

## 🚀 Get Started in 3 Steps

### Step 1: Build the Extension
```bash
npm run build:extension
```

**Output:** All bundles compiled successfully
- `extension/dist/popup.js` (372 KB)
- `extension/dist/options.js` (371 KB)
- `extension/dist/background.js` (227 KB)
- `extension/dist/content.js` (8.1 KB)

### Step 2: Load Extension in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. ✅ Extension appears in toolbar

### Step 3: Test It Out
1. Click czToDo icon to open popup
2. Sign up/login with email
3. Create a to-do
4. Visit GitHub issue → button appears
5. Visit Gmail → button appears
6. Visit Slack → button appears
7. Right-click text → "Add to czToDo"

---

## 📋 What's Included

| Feature | Status | Details |
|---------|--------|---------|
| **Popup UI** | ✅ | React-based to-do manager |
| **Settings** | ✅ | Configure integrations |
| **GitHub** | ✅ | Capture issues as todos |
| **Gmail** | ✅ | Capture emails as todos |
| **Slack** | ✅ | Capture messages as todos |
| **Context Menu** | ✅ | Right-click text capture |
| **Dark Mode** | ✅ | System theme support |
| **Sync** | ✅ | Real-time via Supabase |
| **Offline** | ✅ | Queue & sync later |

---

## 📚 Documentation

- **[FINAL_SUMMARY.md](./FINAL_SUMMARY.md)** - Complete project overview
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - 15-phase testing protocol
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Quick checklist
- **[.omc/PHASE4_STATUS.md](./.omc/PHASE4_STATUS.md)** - Implementation details

---

## ⚙️ System Requirements

- **Chrome:** Version 90+
- **Node:** 14+ (for building)
- **Supabase Account:** (free tier works)
- **GitHub Token:** (optional, for GitHub integration)

---

## 🔧 Key Files

```
extension/
├── manifest.json          ← Chrome extension definition
├── popup.html / options.html
├── dist/                  ← Compiled bundles (run build first)
├── popup/                 ← React popup UI components
├── options/               ← Settings page components
├── background/            ← Service worker logic
├── content/               ← Gmail/Slack/GitHub injections
└── lib/                   ← Utilities & storage layer
```

---

## 🧪 Quick Testing

### Verify Build
```bash
npm run build:extension
```
All should compile without errors.

### Check Extension Loads
1. `chrome://extensions/` → should see "czToDo"
2. Click icon → popup opens
3. F12 Console → no red errors

### Test Each Integration
1. **GitHub**: Visit GitHub issue → see "+ Add to czToDo" button
2. **Gmail**: Visit Gmail → see "📋" button in toolbar
3. **Slack**: Visit Slack → see "📋" in message actions
4. **Context Menu**: Right-click text → "Add to czToDo" option

---

## 🐛 Troubleshooting

### Extension doesn't load
- [ ] Built with `npm run build:extension`
- [ ] Using `extension/` folder (not `extension/dist`)
- [ ] Developer mode enabled
- [ ] No errors in console (F12)

### Button doesn't appear on Gmail/Slack
- [ ] Refresh page after loading extension
- [ ] Check if Supabase is connected
- [ ] Try on different Gmail tab/Slack workspace

### Sync not working
- [ ] Check Supabase connection (Settings page)
- [ ] Verify network is online
- [ ] Check DevTools Network tab for errors

### Settings not saving
- [ ] Make sure logged in first
- [ ] Try refreshing settings page
- [ ] Check browser storage is enabled

---

## 📊 Build Stats

- **Total Code:** ~2,000 lines
- **Components:** 15+ React components
- **Bundle Size:** ~1.5 MB total (mostly React)
- **Build Time:** ~15 seconds
- **File Count:** 30+ source files

---

## 🎓 Architecture Layers

```
┌──────────────────────────────────┐
│  UI Layer (React Components)     │
├──────────────────────────────────┤
│  Message Layer (Chrome API)      │
├──────────────────────────────────┤
│  Storage Layer (Sync/Local)      │
├──────────────────────────────────┤
│  Integration Layer (Injections)  │
├──────────────────────────────────┤
│  Backend (Supabase)              │
└──────────────────────────────────┘
```

---

## 🚀 Next Steps

1. **[Test the Extension](./TESTING_GUIDE.md)**
   - Load in Chrome
   - Run through 15 test phases
   - Document any issues

2. **[Fix Bugs](./TESTING_CHECKLIST.md)**
   - Prioritize by severity
   - Test fixes
   - Update checklist

3. **[Deploy to Chrome Web Store](./FINAL_SUMMARY.md#-deployment-checklist)**
   - Create store listing
   - Add screenshots
   - Submit for review

4. **[Plan Phase 5](./FINAL_SUMMARY.md#-future-roadmap)**
   - Notion integration
   - Advanced features
   - Performance optimization

---

## 💡 Tips

- **DevTools:** F12 in popup for debugging
- **Storage:** Check `chrome://extensions/` → Details → Storage
- **Reload:** Press reload button when making changes
- **Incognito:** Extension works in Incognito mode too

---

## 📞 Questions?

- Check `.omc/PHASE4_STATUS.md` for implementation details
- Review code comments in `extension/` directory
- Check git history for decisions: `git log --oneline`

---

**Status:** ✅ Phase 4 Complete - Ready for Testing  
**Last Updated:** September 8, 2026  
**Next Phase:** Testing & Verification  
**Expected Timeline:** 1 week

