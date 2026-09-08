# czToDo Extension - Testing & Verification Checklist

## ✅ Build Status

- [x] popup.js compiled successfully (372KB)
- [x] options.js compiled successfully (371KB)
- [x] background.js compiled successfully (227KB)
- [x] content.js compiled successfully (8.1KB)
- [x] All assets in extension/ directory
- [x] Manifest.json properly configured

## 🧪 Testing Protocol

### Phase 1: Extension Load Test
- [ ] Load extension in Chrome
- [ ] Check chrome://extensions/ shows czToDo
- [ ] Verify extension icon appears in toolbar
- [ ] Check for any console errors
- [ ] Test extension can be disabled/enabled

### Phase 2: Popup UI Test
- [ ] Click extension icon to open popup
- [ ] Verify popup dimensions (400x500px)
- [ ] Check header displays "czToDo"
- [ ] Verify sync status indicator visible
- [ ] Test theme appears (light/dark based on OS)

### Phase 3: Login & Authentication
- [ ] Display login form when not authenticated
- [ ] Email input accepts valid email
- [ ] Password input works (masked)
- [ ] "Sign Up" link toggles form mode
- [ ] Login button submits form
- [ ] After login, todo list appears
- [ ] Logout button visible after login
- [ ] Logout clears auth and shows login form

### Phase 4: Todo Management
- [ ] Add new todo from popup
- [ ] Todo appears in list immediately (optimistic update)
- [ ] Todo shows in multiple Chrome windows/tabs
- [ ] Edit todo (click to edit title)
- [ ] Mark todo as complete (checkbox)
- [ ] Delete todo (✕ button)
- [ ] Filter by status (Active/Completed/All)
- [ ] Empty state message shows when no todos

### Phase 5: Settings Page
- [ ] Open settings (right-click extension → Options)
- [ ] Settings page loads with proper styling
- [ ] Account section shows logged-in email
- [ ] GitHub section displays token input
- [ ] GitHub connection test button works
- [ ] Notification preferences toggles work
- [ ] Integration status shows current connections
- [ ] Settings persist after refresh

### Phase 6: GitHub Integration
- [ ] Navigate to GitHub issue/PR
- [ ] "+ Add to czToDo" button appears in issue header
- [ ] Click button creates todo with issue link
- [ ] Todo contains issue title, number, URL
- [ ] Button shows "✓ Added" confirmation
- [ ] GitHub token properly validates

### Phase 7: Gmail Integration
- [ ] Navigate to Gmail (mail.google.com)
- [ ] Open an email/thread
- [ ] "📋 Add to czToDo" button appears in toolbar
- [ ] Click button creates todo from email
- [ ] Todo contains email subject, sender, URL
- [ ] Email body preview included if available

### Phase 8: Slack Integration
- [ ] Navigate to Slack workspace (slack.com)
- [ ] Open a message thread
- [ ] "📋 Add to czToDo" button appears in actions
- [ ] Click button creates todo from message
- [ ] Todo contains message text, author, channel
- [ ] Slack message link included

### Phase 9: Context Menu Test
- [ ] Right-click on any text selection
- [ ] "Add to czToDo" context menu appears
- [ ] Click menu creates todo with selected text
- [ ] Page URL included in source_url
- [ ] Page title included in description

### Phase 10: Sync & Offline
- [ ] Add todo while online
- [ ] Verify syncs to Supabase
- [ ] Open same account in different Chrome window
- [ ] Verify todo appears in other window
- [ ] Disconnect network (DevTools)
- [ ] Add todo while offline
- [ ] Verify todo queued locally
- [ ] Reconnect network
- [ ] Verify queued todo syncs
- [ ] Sync status shows appropriate indicator

### Phase 11: Dark Mode Test
- [ ] Toggle OS dark mode (or browser setting)
- [ ] Popup updates colors appropriately
- [ ] Options page updates colors
- [ ] Text remains readable in both modes
- [ ] Buttons still visible and clickable
- [ ] No visual glitches or missing elements

### Phase 12: Animations & UX
- [ ] Popup slides in smoothly on open
- [ ] Todos slide in when loading
- [ ] Buttons show hover effects
- [ ] Sync indicator animates (spinning circle)
- [ ] Button clicks show feedback
- [ ] Form inputs show focus state
- [ ] Scrolling is smooth

### Phase 13: Performance
- [ ] Popup opens without lag
- [ ] Adding todo is responsive
- [ ] Sync doesn't block UI
- [ ] Settings page loads quickly
- [ ] No memory leaks (check DevTools)
- [ ] CPU usage reasonable during idle
- [ ] Bundle sizes within limits

### Phase 14: Edge Cases
- [ ] Very long todo titles display correctly
- [ ] Many todos load smoothly (100+)
- [ ] Special characters in todos work
- [ ] Unicode/emoji support in todos
- [ ] Network timeout handled gracefully
- [ ] Auth token expiration handling
- [ ] Rapid clicking/actions handled
- [ ] Tab switching doesn't break sync

### Phase 15: Error Handling
- [ ] Network error shows message
- [ ] Auth error prompts re-login
- [ ] Invalid GitHub token caught
- [ ] Missing required fields caught
- [ ] Graceful degradation if Supabase down
- [ ] Error messages are helpful

## 📝 Bug Reports

### Found Issues
(Add any bugs discovered during testing)

1. **Issue Name:** Description
   - **Severity:** Critical/High/Medium/Low
   - **Steps:** How to reproduce
   - **Expected:** What should happen
   - **Actual:** What actually happens
   - **Status:** Open/Resolved

## ✅ Final Verification

- [ ] All 15 test phases passed
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] UI matches design
- [ ] All integrations working
- [ ] Dark mode complete
- [ ] Animations smooth
- [ ] Error handling robust
- [ ] Documentation updated
- [ ] Ready for production release

## 🚀 Sign-Off

- **Tested by:** [Your name]
- **Date:** [Date]
- **Build:** [Commit hash]
- **Status:** ✅ Passed / ⚠️ With Known Issues / ❌ Failed

---

**Next Steps After Testing:**
1. Fix any critical bugs found
2. Optimize bundle sizes (if over limits)
3. Submit to Chrome Web Store
4. Create extension landing page
5. Plan Phase 5+ features

