# 🛠️ Scripts Directory

Utility scripts for building, validating, and debugging the czToDo application.

## Scripts

### validate-extension.sh
**Purpose:** Validates that the Chrome extension is ready for loading

**Usage:**
```bash
chmod +x @scripts/validate-extension.sh
./@scripts/validate-extension.sh
```

**Checks:**
- ✅ Directory structure (`extension/` exists)
- ✅ `manifest.json` is valid JSON
- ✅ All required files exist (manifest, HTML files, JS bundles)
- ✅ Build artifacts are compiled (non-zero size)
- ✅ Bundle sizes are reasonable (warns if > 500KB)
- ✅ Build artifacts are up to date
- ✅ `node_modules` exists
- ✅ Environment configuration (`.env.local` with Supabase)

**Exit Codes:**
- `0` - Success, extension is ready to load
- `1` - Errors found, extension needs fixing

**Output:**
- Green checkmarks (✓) for passed checks
- Red X marks (✗) for errors
- Yellow warnings (⚠) for non-critical issues

### debug-app.sh
**Purpose:** Debug helper script for the application

**Usage:**
```bash
chmod +x @scripts/debug-app.sh
./@scripts/debug-app.sh
```

## Used By

These scripts are used in:
- **GitHub Actions** (`.github/workflows/build.yml`) - Automatic validation on build
- **Local Development** - Manual validation before testing
- **CI/CD Pipeline** - Quality checks before deployment

## Scripts in CI/CD Pipeline

The `build.yml` workflow automatically calls:
1. `npm run build:extension` - Build the extension
2. `./@scripts/validate-extension.sh` - Validate the build

## Adding New Scripts

When adding new scripts:
1. Place in this `@scripts/` directory
2. Add description to this README
3. Make scripts executable: `chmod +x @scripts/scriptname.sh`
4. Update relevant workflows if needed
5. Document usage and exit codes
