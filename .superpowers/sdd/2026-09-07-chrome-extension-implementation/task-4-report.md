# Task 4 Report: Create extension manifest and popup HTML

## Status: DONE

## Files Created

1. `extension/manifest.json` — Manifest V3 config (permissions, host_permissions, action/popup+icons, background service worker, content_scripts, icons)
2. `extension/popup.html` — Popup HTML shell with `#root` div and `dist/popup.js` script tag
3. `tsconfig.extension.json` — Extends `./tsconfig.json`, ES2020/DOM/DOM.Iterable lib, `include: ["extension/**/*"]`
4. `extension/assets/icons/icon-16.png` (16x16, solid color placeholder via ImageMagick)
5. `extension/assets/icons/icon-48.png` (48x48, solid color placeholder via ImageMagick)
6. `extension/assets/icons/icon-128.png` (128x128, solid color placeholder via ImageMagick)

All content copied exactly from plan section "Task 4: Create extension manifest and popup HTML" (docs/superpowers/plans/2026-09-07-chrome-extension-implementation.md, lines 500-637), except icons: instead of the plan's text-placeholder fallback (`echo "PNG placeholder..." > icon.png`), real minimal valid PNGs at the correct pixel dimensions were generated with ImageMagick (`convert -size WxH xc:'#4F46E5' ...`), since `convert`/`magick` were available in the environment. This satisfies the same "minimal/placeholder" success criterion while also being valid PNG image data at the correct sizes.

## Validation Output

### manifest.json (`node -e "console.log(JSON.parse(require('fs').readFileSync('extension/manifest.json')))"`)
```
{
  manifest_version: 3,
  name: 'czToDo',
  version: '0.1.0',
  description: 'Manage your to-dos across all devices',
  permissions: [ 'storage', 'contextMenus', 'scripting', 'activeTab' ],
  host_permissions: [ '<all_urls>' ],
  action: {
    default_popup: 'popup.html',
    default_title: 'czToDo',
    default_icons: {
      '16': 'assets/icons/icon-16.png',
      '48': 'assets/icons/icon-48.png',
      '128': 'assets/icons/icon-128.png'
    }
  },
  background: { service_worker: 'dist/background.js', type: 'module' },
  content_scripts: [ { matches: [Array], js: [Array], run_at: 'document_start' } ],
  icons: {
    '16': 'assets/icons/icon-16.png',
    '48': 'assets/icons/icon-48.png',
    '128': 'assets/icons/icon-128.png'
  }
}
```
JSON parsed successfully; `manifest_version` confirmed as `3`.

### tsconfig.extension.json
Parsed successfully via `node -e "JSON.parse(...)"` — valid JSON, `extends`/`compilerOptions`/`include`/`exclude` all present as specified.

### popup.html
Checked via Node script:
- `DOCTYPE: true`
- `has root div: true`
- `has script: true`

### Icon files
```
extension/assets/icons/icon-16.png:  PNG image data, 16 x 16, 1-bit colormap, non-interlaced
extension/assets/icons/icon-48.png:  PNG image data, 48 x 48, 1-bit colormap, non-interlaced
extension/assets/icons/icon-128.png: PNG image data, 128 x 128, 1-bit colormap, non-interlaced
```
All three are valid PNGs at the correct dimensions.

## Commit

```
git add extension/manifest.json extension/popup.html tsconfig.extension.json extension/assets/
git commit -m "feat: add extension manifest, popup HTML, and config"
```

Commit hash: `621a64e3bca5dbf0c383aa88f5ea71a8bb995502`

```
[master 621a64e] feat: add extension manifest, popup HTML, and config
 6 files changed, 83 insertions(+)
 create mode 100644 extension/assets/icons/icon-128.png
 create mode 100644 extension/assets/icons/icon-16.png
 create mode 100644 extension/assets/icons/icon-48.png
 create mode 100644 extension/manifest.json
 create mode 100644 extension/popup.html
 create mode 100644 tsconfig.extension.json
```

## Success Criteria Check
- [x] All four files exist in correct locations
- [x] manifest.json is valid JSON
- [x] manifest_version is 3
- [x] popup.html is valid HTML
- [x] tsconfig.extension.json is valid JSON
- [x] Three icon files exist (real valid PNGs at correct dimensions, not just placeholders)
- [x] Files committed
