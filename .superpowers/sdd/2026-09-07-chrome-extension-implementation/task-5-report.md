# Task 5 Report: Set up build toolchain (Webpack + TypeScript)

## 1. Dependencies installed

`npm install --save-dev`:
- webpack (^5.110.3, resolved 5.110.3)
- webpack-cli (^7.2.3, resolved 7.2.3)
- ts-loader (^9.6.2, resolved 9.6.2)
- @types/chrome (^0.2.9)
- dotenv-webpack (^9.0.0, resolved 9.0.0)
- style-loader (^4.0.0, resolved 4.0.0)
- css-loader (^7.1.5, resolved 7.1.5)

All added to `devDependencies` in package.json; `package-lock.json` updated accordingly.

## 2. webpack.extension.js created

Created at repo root with exact code from plan section 3.2, Task 5, Step 2 — an array of three webpack configs:

1. **Popup UI bundle** — entry `./extension/popup/index.tsx`, output `extension/dist/popup.js`. Uses `ts-loader` for `.tsx?`/TypeScript and `style-loader`/`css-loader` for `.css`. Loads `Dotenv` plugin pointed at `.env.local`.
2. **Background worker bundle** — entry `./extension/background/index.ts`, output `extension/dist/background.js`. Uses `ts-loader` for `.ts`. Loads `Dotenv` plugin pointed at `.env.local`.
3. **Content script bundle** — entry `./extension/content/index.ts`, output `extension/dist/content.js`. Uses `ts-loader` for `.ts`. No Dotenv plugin (matches plan exactly).

Verified the config module loads correctly via `node -e "require('./webpack.extension.js')"` — returns 3 bundle configs with correct entries/filenames.

## 3. package.json scripts updated

Added two new scripts, all existing scripts kept unchanged:

```json
"build:extension": "webpack --config webpack.extension.js --mode production",
"dev:extension": "webpack watch --config webpack.extension.js --mode development",
```

Note: the plan's Step 3 example also shows a combined top-level `"build": "npm run build:web && npm run build:extension"`, but the task instructions explicitly say "Keep existing scripts unchanged," and the repo's existing `build` script is `prisma generate && next build` (not `build:web`). Per the task's explicit instruction, the existing `build` script was left untouched and only the two extension-specific scripts were added.

## 4. Webpack validation output

The literal command specified in the task, `npx webpack --config webpack.extension.js --help`, fails under webpack-cli 7.x with:

```
[webpack-cli] ✖ Incorrect use of help
[webpack-cli] ✖ Please use: 'webpack help [command] [option]' | 'webpack [command] --help'
```

This is a CLI syntax change in webpack-cli 7.x (installed via `webpack-cli@^7.2.3`, which was the latest version `npm install` resolved) — `--help` combined with `--config` is no longer valid; `--help` must be used alone or via `webpack help <command>`.

Validated the config is otherwise correct and loadable via two alternate checks that both succeeded:
- `node -e "require('./webpack.extension.js')"` — loads without error, reports 3 bundles with correct entries/filenames.
- `npx webpack --config webpack.extension.js --version` — loads the config (resolving all referenced loaders/plugins: css-loader, dotenv-webpack, style-loader, ts-loader, webpack, webpack-cli) and prints versions without error.

## 5. Commit hash

```
5b8f362b2967ef32a0c65b423cfc2de00eb84296 chore: set up Webpack build for extension
```

Files in commit: `webpack.extension.js` (new), `package.json` (modified), `package-lock.json` (modified).

## Status: ⚠️ DONE_WITH_CONCERNS

**Concern:** The exact validation command in the task instructions (`npx webpack --config webpack.extension.js --help`) does not work as written because the resolved `webpack-cli` version (7.2.3, latest at install time) changed `--help` CLI syntax. This is unrelated to the config itself — the config was independently verified valid via `require()` and via `--version`. No entry point files exist yet (`extension/popup/index.tsx`, `extension/background/index.ts`, `extension/content/index.ts` — these are created in later tasks), so an actual `build:extension`/`dev:extension` run was not attempted and would fail until those files exist; this matches the plan's task ordering.
