# czToDo Extension - Loading & Testing Guide

**Status:** ✅ Build Complete - Ready to Load in Chrome

---

## 🚀 Step 1: Open Chrome Extensions Page

1. Open Chrome browser
2. Go to: `chrome://extensions/`
3. You should see a page showing all your installed extensions

---

## 📦 Step 2: Enable Developer Mode

1. In the top-right corner of `chrome://extensions/`, find the **"Developer mode"** toggle
2. Click it to turn ON (should show blue when enabled)
3. New buttons will appear at top-left: "Load unpacked", "Pack extension", etc.

---

## 🔌 Step 3: Load the Extension

1. Click the **"Load unpacked"** button
2. Navigate to: `/home/chez1s/Desktop/code/czToDo/extension`
3. Click **"Select Folder"** (or equivalent in your system dialog)
4. Wait a moment for Chrome to process the extension

**You should see:**
- New "czToDo" extension appears in the list
- Shows ID, version, and status "Enabled"
- Extension icon appears in your Chrome toolbar (top-right)

---

## 🧪 Phase 1: Verify Extension Loads

### Check Extension is Installed
- [ ] "czToDo" appears in `chrome://extensions/` list
- [ ] Status shows "Enabled" (blue toggle on)
- [ ] No red error messages appear
- [ ] Extension icon visible in toolbar

### Open Extension Popup
1. Click the czToDo icon in Chrome toolbar (top-right)
2. A popup window should appear (~400x500px)
3. Check for:
   - [ ] Header displays "czToDo"
   - [ ] No JavaScript errors (check F12 console)
   - [ ] UI renders properly
   - [ ] Text is readable

**If popup doesn't open:**
- Check DevTools: Right-click popup → Inspect → check Console tab for errors
- Reload extension: Go back to `chrome://extensions/`, click reload button
- Check manifest.json is valid

---

## 🔐 Phase 2: Test Authentication

1. **Popup should show login form** with:
   - [ ] Email input field
   - [ ] Password input field
   - [ ] "Sign Up" link
   - [ ] "Login" button

2. **Test with Supabase credentials:**
   - [ ] Create account (if new user) using "Sign Up"
   - [ ] Or login with existing Supabase account
   - [ ] After successful login, should see todo list

3. **Check after login:**
   - [ ] Popup shows list area (empty initially)
   - [ ] Logout button/option visible
   - [ ] Sync status indicator visible

**Note:** You'll need valid Supabase credentials. If you don't have them, set up a free Supabase project:
- Go to https://supabase.com
- Create new project
- Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Add to `.env.local` in the project root
- Rebuild: `npm run build:extension`

---

## ✅ Phase 3: Test Todo Management

Once logged in:

1. **Add a new todo:**
   - [ ] Type "Test todo 1" in input field
   - [ ] Click add button
   - [ ] Todo appears in list immediately
   - [ ] Input field clears

2. **Add another todo:**
   - [ ] Type "Test todo 2"
   - [ ] Click add
   - [ ] Appears below first todo

3. **Check persistence:**
   - [ ] Close popup (click elsewhere)
   - [ ] Click czToDo icon again to reopen
   - [ ] Both todos still appear
   - [ ] No data was lost

4. **Test todo actions:**
   - [ ] Click checkbox next to a todo → should mark as complete
   - [ ] Completed todos appear with strikethrough
   - [ ] Click the ✕ button → todo should delete
   - [ ] Verify removed from list

5. **Test filtering (if available):**
   - [ ] Find filter buttons: "All", "Active", "Completed"
   - [ ] Click "Active" → shows only incomplete todos
   - [ ] Click "Completed" → shows only completed todos
   - [ ] Click "All" → shows everything

---

## ⚙️ Phase 4: Test Settings Page

1. **Open Settings:**
   - Option A: Right-click czToDo icon → "Options"
   - Option B: In `chrome://extensions/`, find czToDo → click "Details" → "Extension options"
   - Option C: Click settings icon in popup (if visible)

2. **Verify Settings Page:**
   - [ ] Page loads without errors
   - [ ] Shows account info (your email)
   - [ ] Displays GitHub section
   - [ ] Shows Notification preferences
   - [ ] Integration status visible

3. **Test Account Section:**
   - [ ] Shows your logged-in email
   - [ ] Logout button present and clickable
   - [ ] Clicking logout should clear auth

4. **Test GitHub Section (Optional):**
   - [ ] GitHub token input field visible
   - [ ] Can paste a GitHub PAT (Personal Access Token)
   - [ ] "Test Connection" button works
   - [ ] Shows result message

5. **Test Notifications:**
   - [ ] Toggle switches work for different notification types
   - [ ] Changes persist after refreshing page

---

## 🌐 Phase 5: Test Gmail Integration (Optional)

1. **Setup:**
   - Go to https://mail.google.com
   - Open any email or thread

2. **Check for button:**
   - [ ] Look in email toolbar for "📋 Add to czToDo" button
   - [ ] Button should appear near archive/delete buttons

3. **Capture email:**
   - [ ] Click the button
   - [ ] Button shows confirmation (✓ Added or similar)
   - [ ] Check czToDo popup → new todo should appear with email subject

4. **Verify email data:**
   - [ ] Todo title = email subject
   - [ ] Todo description includes sender
   - [ ] Clicking todo opens email link

**If button doesn't appear:**
- Refresh Gmail page (F5)
- Check browser console for errors (F12)
- Verify extension is loaded
- Wait a few seconds for content scripts to load

---

## 💬 Phase 6: Test Slack Integration (Optional)

1. **Setup:**
   - Go to https://slack.com
   - Open any workspace and message

2. **Check for button:**
   - [ ] Look for "📋 Add to czToDo" button in message actions
   - [ ] May appear in "More actions" (⋮ menu)

3. **Capture message:**
   - [ ] Click button
   - [ ] Check czToDo popup → new todo appears
   - [ ] Todo contains message text

4. **Verify data:**
   - [ ] Message content preserved
   - [ ] Author/channel info included
   - [ ] Link to message works

---

## 🌙 Phase 7: Test Dark Mode

1. **Enable System Dark Mode:**
   - Go to your system settings
   - Enable Dark mode (varies by OS)
   - Return to Chrome

2. **Check UI updates:**
   - [ ] Open czToDo popup
   - [ ] Colors should be dark (dark background, light text)
   - [ ] Settings page should also be dark
   - [ ] Text remains readable

3. **Disable Dark Mode:**
   - [ ] Turn off system dark mode
   - [ ] UI should switch back to light theme
   - [ ] Colors should be light background, dark text

4. **Visual check:**
   - [ ] No elements disappear in either mode
   - [ ] Buttons visible in both modes
   - [ ] No weird color combinations

---

## 📊 Phase 8: Test Performance

1. **Popup Response:**
   - [ ] Clicking icon opens popup in <500ms (shouldn't lag)
   - [ ] Typing in todo input is responsive
   - [ ] Adding todo responds instantly
   - [ ] No freezing or stuttering

2. **Check with DevTools:**
   - [ ] Right-click popup → Inspect
   - [ ] Open DevTools (F12)
   - [ ] Go to Performance tab
   - [ ] Record and perform actions (add/edit/delete todo)
   - [ ] Check for long tasks (>50ms is slow)
   - [ ] Memory usage should be stable

3. **Settings page:**
   - [ ] Loads quickly
   - [ ] No lag when interacting
   - [ ] Scrolling smooth

---

## 🔄 Phase 9: Test Sync (if Online)

1. **Test cross-device sync:**
   - [ ] Add todo in popup
   - [ ] Open another Chrome window/tab
   - [ ] Click czToDo in new window
   - [ ] New todo should appear within few seconds

2. **Check sync status:**
   - [ ] Look for sync indicator (⟳ or ✓)
   - [ ] Should show "Synced" when complete
   - [ ] Shows "Syncing..." while in progress

---

## 💾 Phase 10: Test Offline Mode (Optional)

1. **Go offline:**
   - Open DevTools (F12)
   - Network tab → set to "Offline"

2. **Add todo while offline:**
   - [ ] Popup still works
   - [ ] Can type and add todos
   - [ ] Todos appear immediately (optimistic update)
   - [ ] Sync status shows "Offline"

3. **Go back online:**
   - [ ] Network tab → set back to "Online"
   - [ ] Sync status changes back to syncing
   - [ ] Queued todos should sync

---

## 🐛 Phase 11: Check for Errors

1. **Open DevTools:**
   - Right-click popup → Inspect → Console tab

2. **Look for:**
   - [ ] No red error messages
   - [ ] No yellow warning messages (can be OK)
   - [ ] If errors exist, note them down

3. **Test console while using extension:**
   - [ ] Add todo → check console (no errors)
   - [ ] Toggle filter → check console
   - [ ] Toggle dark mode → check console
   - [ ] All actions should complete without errors

---

## 📋 Quick Test Checklist

```
✓ Extension loads in Chrome
✓ Popup opens and renders
✓ Login works with Supabase
✓ Can add todos
✓ Can view todos
✓ Can delete todos
✓ Settings page loads
✓ Dark mode works
✓ No JavaScript errors
✓ Popup is responsive
✓ (Optional) Gmail button appears
✓ (Optional) Slack button appears
✓ (Optional) Settings persist
```

---

## 🆘 Troubleshooting

### Popup doesn't open
- Solution: Go to `chrome://extensions/` → find czToDo → reload button
- Check console (F12) for errors
- Try restarting Chrome

### "SUPABASE_URL not found" error
- Solution: Add `.env.local` file with Supabase credentials:
  ```
  VITE_SUPABASE_URL=your_url
  VITE_SUPABASE_ANON_KEY=your_key
  ```
- Rebuild: `npm run build:extension`
- Reload extension in Chrome

### Buttons don't appear in Gmail/Slack
- Solution: Refresh the page (F5)
- Wait 2-3 seconds for content script to initialize
- Check DevTools console for errors
- Try on a different Gmail/Slack page

### Settings don't persist
- Check browser storage is enabled
- Try logging out and back in
- Check DevTools Storage tab → chrome-extension storage

### Dark mode not working
- Verify system dark mode is enabled
- Refresh popup (close and reopen)
- Check browser settings for theme override

### Extension won't load
- Go to `chrome://extensions/`
- Check for error message next to czToDo
- Try removing and re-adding (Load unpacked again)
- Check manifest.json is valid JSON

---

## 📸 Screenshots for Testing

Take screenshots of:
1. [ ] Extension in toolbar
2. [ ] Popup with todos
3. [ ] Settings page
4. [ ] Dark mode version
5. [ ] Gmail/Slack buttons (if visible)

---

## 📝 Bug Template

If you find issues, create a bug report:

```markdown
### Bug: [Title]
**Severity:** Critical / High / Medium / Low
**Environment:** Chrome Version X.X.X
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]
**Expected:** [What should happen]
**Actual:** [What actually happens]
**Screenshots:** [If applicable]
```

---

## ✅ Final Checklist

- [ ] Phase 1: Extension loads
- [ ] Phase 2: Authentication works
- [ ] Phase 3: Todo CRUD works
- [ ] Phase 4: Settings accessible
- [ ] Phase 5: Gmail integration (optional)
- [ ] Phase 6: Slack integration (optional)
- [ ] Phase 7: Dark mode works
- [ ] Phase 8: Performance good
- [ ] Phase 9: Sync works (optional)
- [ ] Phase 10: Offline works (optional)
- [ ] Phase 11: No console errors
- [ ] All critical features verified

---

## 🚀 Next Steps After Testing

1. Document any bugs found
2. Prioritize by severity
3. Fix critical/high bugs
4. Re-test fixed features
5. Update this guide with findings
6. Prepare Chrome Web Store submission

---

**Ready to test?** Follow the steps above and let me know if you find any issues! 🎉

