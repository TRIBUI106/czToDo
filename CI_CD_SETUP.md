# GitHub Actions CI/CD Setup

**Status:** ✅ Configured & Ready  
**Workflows:** 2 (Build + Validate)  
**Trigger:** Push to master/develop, Pull requests

---

## 📋 Overview

Your project now has automated CI/CD pipelines that:

1. **Build Extension** - Compiles all bundles on every push
2. **Validate** - Checks code quality, manifest, bundle sizes

Both workflows run on:
- ✅ Push to `master`
- ✅ Push to `develop`
- ✅ Pull requests to `master` or `develop`

---

## 🔄 Workflow 1: Build Extension

**File:** `.github/workflows/build.yml`

### What it does:
1. Checks out code
2. Installs Node.js 18.x
3. Installs npm dependencies
4. Builds extension with webpack
5. Validates extension structure
6. Creates extension zip file
7. Uploads build artifacts
8. Creates GitHub Release (master only)

### Artifacts Generated:
- `extension-build/` - Compiled bundles (popup.js, options.js, background.js, content.js)
- `czToDo-extension-vX.X.X.zip` - Ready-to-use extension archive

### Release Creation:
On push to master, automatically creates a GitHub Release with:
- Extension zip file
- Release notes with features
- Installation instructions
- Link to documentation

### Access artifacts:
1. Go to Actions tab → Build Extension
2. Click latest run
3. Download from "Artifacts" section
4. Or download from Releases page

---

## 🔄 Workflow 2: Validate

**File:** `.github/workflows/validate.yml`

### What it does:
1. Checks out code
2. Installs dependencies
3. Runs ESLint (if configured)
4. Checks TypeScript compilation
5. Builds extension
6. Validates manifest.json:
   - Checks required fields
   - Verifies Manifest V3
7. Checks bundle sizes:
   - Reports size in KB
   - Warns if over 500 KB
8. Looks for debug console.log statements
9. Tests TypeScript compilation

### What gets validated:
- ✅ All required manifest fields present
- ✅ Using Manifest V3 (required)
- ✅ All bundles compile successfully
- ✅ Bundle sizes reasonable
- ✅ TypeScript errors checked
- ✅ No excessive console.log statements

### View results:
1. Go to Actions tab → Validate & Test
2. Click on workflow run
3. Expand steps to see details
4. Red ✗ means validation failed
5. Green ✓ means validation passed

---

## 📊 Workflow Triggers

### Push to Master
```
git push origin master
↓
Runs: Build Extension + Validate
↓
Creates release (if version changed)
↓
Artifacts available in Actions tab + Releases page
```

### Push to Develop
```
git push origin develop
↓
Runs: Validate
↓
Build runs too
↓
No release created
```

### Pull Request
```
Create PR to master/develop
↓
Runs: Validate + Build
↓
Shows results in PR checks
↓
Must pass before merge
```

---

## 🚀 How to Use

### View Build Results
```
1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Build Extension" workflow
4. Click latest run
5. View logs and download artifacts
```

### Download Built Extension
```
Method 1: From Actions
1. Actions → Build Extension → Latest run
2. Scroll down → Artifacts
3. Download "czToDo-extension-vX.X.X"

Method 2: From Releases
1. Go to Releases page
2. Click latest release
3. Download .zip file from assets
```

### Debug a Failed Build
```
1. Go to Actions → failed workflow
2. Click on failing step
3. View error logs
4. Fix issue locally
5. Push to trigger rebuild
```

### Manual Trigger (if needed)
```
1. Go to Actions tab
2. Select workflow
3. Click "Run workflow" dropdown
4. Click green "Run workflow" button
5. Workflow runs immediately
```

---

## 📦 Build Artifacts Explained

### What you get after each build:

#### 1. Compiled Bundles
```
extension/dist/
├── popup.js          (372 KB)  - Popup UI
├── options.js        (371 KB)  - Settings page
├── background.js     (227 KB)  - Service worker
└── content.js        (8.1 KB)  - Content scripts
```

#### 2. Extension Zip
```
czToDo-extension-vX.X.X.zip
└── Ready to load in Chrome unpacked mode
    OR extract and test locally
```

#### 3. GitHub Release
```
Auto-created on master push
├── Release notes with features
├── Installation instructions
├── Links to documentation
└── Zip file for download
```

---

## 🔐 Environment Variables

Currently using:
- `GITHUB_TOKEN` - Automatic (GitHub Actions provides this)

If you need custom environment variables later:
1. Go to Settings → Secrets and variables → Actions
2. Create new "Repository secret"
3. Use in workflow: `${{ secrets.YOUR_SECRET }}`

---

## ✅ Validation Checks Explained

### 1. Manifest Validation
```
✓ Required fields present:
  - manifest_version
  - name
  - version
  - description

✓ Using Manifest V3 (required for Chrome 88+)
```

### 2. Bundle Size Check
```
✓ popup.js: 372 KB
✓ options.js: 371 KB
✓ background.js: 227 KB
✓ content.js: 8.1 KB

⚠ Warns if over 500 KB (can be optimized)
```

### 3. TypeScript Check
```
✓ No TypeScript compilation errors
✓ All types properly defined
✓ Strict mode compliance
```

### 4. Code Quality
```
✓ Limited console.log statements (for production)
✓ No major linting issues
```

---

## 📊 Example Workflow Run

```
$ git push origin master

↓ GitHub Actions triggered ↓

[Build Extension]
  ✓ Checkout code
  ✓ Setup Node.js 18.x
  ✓ Install dependencies (npm install)
  ✓ Build extension (npm run build:extension)
  ✓ Validate extension (./validate-extension.sh)
  ✓ Check artifacts (ls -lh)
  ✓ Create zip (czToDo-extension-v4.0.0.zip)
  ✓ Upload artifacts
  ✓ Create GitHub Release v4.0.0

[Validate & Test]
  ✓ TypeScript check
  ✓ Manifest validation
  ✓ Bundle size check
  ✓ Console.log check

✅ All workflows passed

GitHub Release created:
  - v4.0.0 published
  - Zip file available for download
  - Release notes generated
```

---

## 🐛 Troubleshooting

### Build Failed: "npm run build:extension not found"
- **Solution:** Make sure `npm run build:extension` exists in package.json
- Check: `cat package.json | grep "build:extension"`

### Build Failed: "Node modules not found"
- **Solution:** npm install step failed
- Check: Node version matches (18.x)
- Check: No lock file issues

### Build Failed: TypeScript errors
- **Solution:** Fix TypeScript errors locally first
- Run: `npm run build:extension` locally to see errors
- Fix errors and commit

### Artifacts not showing
- **Solution:** Check if build passed
- Go to Actions → workflow run → scroll to "Artifacts" section
- If no section, build failed

### Release not created
- **Solution:** Releases only created on master push
- Make sure pushing to `master` branch
- Check: git branch shows `* master`

---

## 🔧 Customization

### Change Node Version
Edit `.github/workflows/build.yml`:
```yaml
node-version: [18.x]  # Change to 16.x, 20.x, etc.
```

### Add Slack Notification
Add to workflow:
```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
```

### Skip Release Creation
Edit `.github/workflows/build.yml`, comment out:
```yaml
# - name: Create Release (on master push only)
#   if: github.event_name == 'push' && github.ref == 'refs/heads/master'
```

### Add Test Step
Add to validation workflow:
```yaml
- name: Run Tests
  run: npm test
```

---

## 📈 Monitoring

### Check Status
1. Go to Actions tab
2. Green checkmark ✓ = passed
3. Red X = failed

### View Logs
1. Click workflow run
2. Click step name
3. Expand to see full logs

### Branch Protection (Recommended)
1. Go to Settings → Branches
2. Add rule for `master`
3. Require workflows to pass before merge

---

## 📚 Related Files

- `package.json` - npm scripts and dependencies
- `webpack.extension.js` - Build configuration
- `tsconfig.extension.json` - TypeScript configuration
- `extension/manifest.json` - Chrome extension config
- `.eslintrc.json` - Linting rules (optional)

---

## ✅ Checklist

- [x] GitHub Actions workflows created
- [x] Build workflow configured
- [x] Validation workflow configured
- [x] Artifact upload enabled
- [x] Release creation enabled
- [x] Documentation written

---

## 🚀 First Run

Next time you push to master:

```bash
git push origin master
```

GitHub will automatically:
1. ✅ Build the extension
2. ✅ Validate all checks
3. ✅ Create release
4. ✅ Upload artifacts
5. ✅ Generate release notes

**All automatically! No manual steps needed!** 🎉

---

## 💡 Tips

- **Fast feedback:** Push to develop first to test
- **Releases:** Only created on master, so use for stable versions
- **Artifacts:** Keep for 30 days before auto-delete
- **Debug:** View workflow logs to troubleshoot
- **Manual:** Can trigger workflows manually from Actions tab

---

**Status:** ✅ CI/CD Ready to Use  
**Next Step:** Push to master to trigger first automated build!

