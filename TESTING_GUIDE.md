# czToDo Extension - Testing & Deployment Guide

## 🚀 Quick Start

### Load the Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Navigate to `/extension/` directory in this project
5. Extension should appear in toolbar

### Verify Build
```bash
npm run build:extension
```

All bundles should compile successfully:
- ✅ `extension/dist/popup.js` (372 KB)
- ✅ `extension/dist/options.js` (371 KB)
- ✅ `extension/dist/background.js` (227 KB)
- ✅ `extension/dist/content.js` (8.1 KB)

---

## 🧪 Testing Protocol

### Phase 1: Extension Load Test
**Goal:** Verify extension loads without errors

1. Navigate to `chrome://extensions/`
2. Confirm "czToDo" appears in the list
3. Check extension status is "Enabled"
4. Click extension icon in toolbar - popup should open
5. Check DevTools for any console errors:
   - Right-click popup → Inspect
   - Check Console tab for errors

**Expected Results:**
- Extension appears in list
- Extension icon visible in toolbar
- Popup opens without errors
- No red error messages in console

---

### Phase 2: Popup UI Test
**Goal:** Verify UI renders correctly

1. Click czToDo extension icon
2. Popup window should appear (400x500px)
3. Check:
   - [ ] Header displays "czToDo" title
   - [ ] Sync status indicator visible
   - [ ] Theme matches system preference (light/dark)
   - [ ] No layout issues or missing elements
   - [ ] Fonts and colors render properly

**Expected Results:**
- Popup dimensions correct
- All UI elements visible
- Text readable
- Colors match theme

---

### Phase 3: Authentication Test
**Goal:** Verify login/signup works

1. Popup should show login form
2. Test email input:
   - [ ] Type valid email address
   - [ ] Field accepts input
3. Test password input:
   - [ ] Type password
   - [ ] Text is masked (•••)
4. Click "Sign Up" link:
   - [ ] Form toggles to signup mode
   - [ ] "Sign Up" button appears
5. If using existing account:
   - [ ] Login with valid credentials
   - [ ] After login, todo list should appear
6. Test logout:
   - [ ] Look for logout/settings button
   - [ ] Click logout
   - [ ] Return to login form

**Expected Results:**
- Login form validates email/password
- Auth completes successfully
- Todo list displays after login
- Logout clears auth state

---

### Phase 4: Todo Management Test
**Goal:** Verify CRUD operations work

1. Add a new todo:
   - [ ] Type todo text in input
   - [ ] Click add button
   - [ ] Todo appears in list immediately
   - [ ] Input clears for next entry

2. Verify persistence:
   - [ ] Close and reopen popup
   - [ ] Todo still appears in list

3. Test todo actions:
   - [ ] Click checkbox - todo should mark as complete
   - [ ] Click edit - should allow editing title
   - [ ] Click delete (✕) - todo should remove from list

4. Test filters (if implemented):
   - [ ] "Active" filter shows only incomplete todos
   - [ ] "Completed" filter shows only completed todos
   - [ ] "All" filter shows everything

**Expected Results:**
- Todos add/edit/delete successfully
- UI updates immediately
- Data persists across sessions
- Filters work correctly

---

### Phase 5: Settings Page Test
**Goal:** Verify settings page loads and works

1. Access settings:
   - Right-click czToDo icon → "Options"
   - Or: chrome://extensions/ → czToDo → "Details" → "Extension options"

2. Verify page loads:
   - [ ] Settings page displays correctly
   - [ ] No console errors
   - [ ] Theme matches system preference

3. Test Account section:
   - [ ] Shows logged-in email
   - [ ] Logout button present and works

4. Test GitHub section:
   - [ ] GitHub token input field visible
   - [ ] Can paste GitHub personal access token
   - [ ] "Test Connection" button works
   - [ ] Displays success/error message

5. Test Notification section:
   - [ ] Toggle switches work
   - [ ] Settings persist after refresh

6. Test Integration Status:
   - [ ] Shows connection status for each service
   - [ ] Updates after connecting services

**Expected Results:**
- Settings page loads without errors
- All inputs work correctly
- Settings persist
- No layout issues

---

### Phase 6: GitHub Integration Test
**Goal:** Verify GitHub issue detection and capture

1. Obtain GitHub personal access token:
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create new token with "repo" scope
   - Copy token (starts with "ghp_")

2. Enter token in settings:
   - Open czToDo settings
   - Paste token in GitHub field
   - Click "Test Connection"
   - Should show success message

3. Test issue detection:
   - [ ] Navigate to any GitHub issue
   - [ ] Look for "+ Add to czToDo" button in issue header
   - [ ] Click button
   - [ ] Button shows "✓ Added" confirmation
   - [ ] Check czToDo popup - new todo should appear with issue link

4. Verify issue data:
   - Todo should contain:
     - [ ] Issue title
     - [ ] Issue number
     - [ ] Link to issue
     - [ ] Source marked as "GitHub"

**Expected Results:**
- GitHub token validates successfully
- Button appears on GitHub issues
- Todo creates with issue details
- Confirmation message displays

---

### Phase 7: Gmail Integration Test
**Goal:** Verify Gmail email capture

1. Navigate to Gmail (mail.google.com)
2. Open an email thread
3. Look for "📋 Add to czToDo" button in toolbar
4. Click button:
   - [ ] Button shows success indication
   - [ ] Check czToDo popup - new todo should appear
5. Verify email data:
   - Todo should contain:
     - [ ] Email subject
     - [ ] Sender email address
     - [ ] Email body preview (first 500 chars)
     - [ ] Link to email thread
     - [ ] Source marked as "Gmail"

**Expected Results:**
- Button appears in Gmail interface
- Todo creates with email details
- Email link is clickable
- Data captures correctly

---

### Phase 8: Slack Integration Test
**Goal:** Verify Slack message capture

1. Navigate to Slack workspace (slack.com)
2. Open any message or thread
3. Look for "📋 Add to czToDo" button in message actions
4. Click button:
   - [ ] Button shows success
   - [ ] Check czToDo popup - new todo appears
5. Verify message data:
   - Todo should contain:
     - [ ] Message text/content
     - [ ] Sender/author name
     - [ ] Channel name
     - [ ] Link to message
     - [ ] Source marked as "Slack"

**Expected Results:**
- Button appears in Slack interface
- Todo creates with message details
- Channel context preserved
- Link directs to message

---

### Phase 9: Context Menu Test
**Goal:** Verify right-click text capture

1. Visit any web page
2. Select some text on page
3. Right-click → "Add to czToDo"
4. Check popup:
   - [ ] New todo appears with selected text
   - [ ] Page URL included
   - [ ] Page title in description
5. Try with different content:
   - [ ] Regular text
   - [ ] Code blocks
   - [ ] Links
   - [ ] Special characters/emoji

**Expected Results:**
- Context menu option appears
- Text captures correctly
- URL and page title included
- Works with various content types

---

### Phase 10: Sync & Offline Test
**Goal:** Verify sync and offline handling

1. **Online Sync:**
   - [ ] Add todo while online
   - [ ] Open popup in different Chrome window/tab
   - [ ] New todo appears in other window within seconds
   - [ ] Sync status shows "✓ Synced"

2. **Offline Mode:**
   - [ ] Open Chrome DevTools (F12)
   - [ ] Go to Network tab → disable network
   - [ ] Add new todo
   - [ ] Todo appears in popup (optimistic update)
   - [ ] Sync status shows "⚠ Offline"

3. **Reconnect:**
   - [ ] Re-enable network
   - [ ] Sync status changes back to "✓ Synced"
   - [ ] Queued todo syncs to server
   - [ ] Verify in other windows

**Expected Results:**
- Sync works across devices
- Offline queue prevents data loss
- Status indicator accurate
- Data syncs when online

---

### Phase 11: Dark Mode Test
**Goal:** Verify dark mode support

1. **System Dark Mode:**
   - [ ] Enable system dark mode
   - [ ] Open czToDo popup - should use dark colors
   - [ ] Settings page - should use dark colors
   - [ ] Text remains readable
   - [ ] No visual glitches

2. **Light Mode:**
   - [ ] Disable dark mode
   - [ ] UI switches to light theme
   - [ ] Proper contrast maintained

3. **Visual Check:**
   - [ ] Buttons visible in both modes
   - [ ] Hover effects work
   - [ ] Icons render correctly
   - [ ] Scrollbars visible

**Expected Results:**
- Dark mode enables/disables with system
- Colors change appropriately
- Text contrast acceptable
- No rendering issues

---

### Phase 12: Animations & UX Test
**Goal:** Verify smooth interactions

1. **Popup Animation:**
   - [ ] Popup slides in smoothly when opened
   - [ ] No janky movements

2. **Todo Animations:**
   - [ ] Todos fade/slide in when loading
   - [ ] No layout shift
   - [ ] Smooth transitions

3. **Interactive Elements:**
   - [ ] Buttons show hover effects
   - [ ] Click feedback visible
   - [ ] Sync indicator spins smoothly
   - [ ] Form inputs show focus state

4. **Performance:**
   - [ ] No visible lag when clicking
   - [ ] Smooth scrolling
   - [ ] No CPU spikes in DevTools

**Expected Results:**
- Animations smooth and professional
- No performance issues
- UX feels responsive
- Visual feedback present

---

### Phase 13: Performance Test
**Goal:** Verify performance metrics

1. **Popup Performance:**
   - [ ] Popup opens in <500ms
   - [ ] Adding todo takes <1s
   - [ ] Settings load quickly

2. **DevTools Check:**
   - [ ] Open DevTools (F12)
   - [ ] Performance tab → Record
   - [ ] Click through UI
   - [ ] Check for long tasks (>50ms)
   - [ ] Memory usage stable

3. **Bundle Sizes:**
   - [ ] popup.js: 372 KB ✓
   - [ ] options.js: 371 KB ✓
   - [ ] background.js: 227 KB ✓
   - [ ] content.js: 8.1 KB ✓

**Expected Results:**
- Operations complete quickly
- No memory leaks
- Bundle sizes reasonable
- Smooth 60 FPS interactions

---

### Phase 14: Edge Cases Test
**Goal:** Verify robustness

1. **Long Text:**
   - [ ] Add todo with very long title (500+ chars)
   - [ ] Verify text wraps properly
   - [ ] No layout breaking

2. **Many Todos:**
   - [ ] Create 50+ todos
   - [ ] List remains responsive
   - [ ] Scrolling works smoothly

3. **Special Characters:**
   - [ ] Add todos with: émojis 😀, special chars (é ñ ü), unicode
   - [ ] Verify display correctly

4. **Network Issues:**
   - [ ] Disable network while syncing
   - [ ] Error message should appear
   - [ ] No crashes

5. **Token Expiration:**
   - [ ] Let auth token expire
   - [ ] UI should prompt re-login
   - [ ] No silent failures

**Expected Results:**
- Extension handles edge cases gracefully
- No crashes or layout breaks
- Appropriate error messages
- Data integrity maintained

---

### Phase 15: Error Handling Test
**Goal:** Verify error messages and recovery

1. **Network Errors:**
   - [ ] Disable network
   - [ ] Trigger action (add/edit todo)
   - [ ] Error message displays
   - [ ] Message is helpful

2. **Auth Errors:**
   - [ ] Use invalid credentials
   - [ ] Show clear error
   - [ ] Suggest retry/signup

3. **Invalid Tokens:**
   - [ ] Enter invalid GitHub token
   - [ ] Test connection fails gracefully
   - [ ] Error message explains problem

4. **Missing Fields:**
   - [ ] Try to add empty todo
   - [ ] Validation error appears
   - [ ] User guided to fix

5. **Service Down:**
   - [ ] Simulate Supabase unavailable
   - [ ] Extension still functions offline
   - [ ] Graceful degradation shown

**Expected Results:**
- All errors show helpful messages
- No silent failures
- Users guided toward resolution
- No technical jargon in errors

---

## ✅ Final Verification Checklist

- [ ] Phase 1: Extension loads without errors
- [ ] Phase 2: Popup UI renders correctly
- [ ] Phase 3: Login/auth works
- [ ] Phase 4: Todos CRUD operations work
- [ ] Phase 5: Settings page functional
- [ ] Phase 6: GitHub integration working
- [ ] Phase 7: Gmail integration working
- [ ] Phase 8: Slack integration working
- [ ] Phase 9: Context menu captures text
- [ ] Phase 10: Sync and offline working
- [ ] Phase 11: Dark mode toggle works
- [ ] Phase 12: Animations smooth
- [ ] Phase 13: Performance acceptable
- [ ] Phase 14: Edge cases handled
- [ ] Phase 15: Error handling robust

---

## 📝 Bug Reporting Template

If you find bugs during testing, use this template:

```markdown
### Bug: [Brief Title]

**Severity:** Critical / High / Medium / Low

**Environment:**
- Chrome Version: [X.X.X]
- Extension Version: Phase 4
- OS: Windows/Mac/Linux

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Logs:**
[Attach if possible]

**Additional Notes:**
[Any other relevant info]
```

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅
1. Create Chrome Web Store listing
2. Add extension screenshots (1280x800)
3. Write compelling store description
4. Set privacy policy
5. Submit for review

### If Issues Found ❌
1. Document bugs in `.omc/BUGS.md`
2. Fix critical/high severity issues
3. Re-test fixed features
4. Update test checklist with results

### Future Phases
- Phase 5: Advanced integrations (Notion, Linear, Jira)
- Phase 6: Web dashboard companion
- Phase 7: Enterprise features

---

## 📞 Support

For questions or issues:
- Check `FINAL_SUMMARY.md` for architecture overview
- Review code in `/extension/` directory
- Check git history for implementation details
- Contact project owner

---

**Last Updated:** September 8, 2026  
**Status:** Ready for Testing  
**Next Review:** After testing phase completion
