# Task 5: Set up build toolchain (Webpack + TypeScript)

**Files:**
- Create: `webpack.extension.js`
- Modify: `package.json` (add build scripts and dependencies)

**Interfaces:**
- Produces: `npm run build:extension` and `npm run dev:extension` commands
- Produces: Compiled JS bundles in `extension/dist/`

**Steps:**

1. Install build dependencies:
   - `webpack`
   - `webpack-cli`
   - `ts-loader`
   - `@types/chrome`
   - `dotenv-webpack`
2. Create `webpack.extension.js` with three configurations:
   - Popup entry `./extension/popup/index.tsx` → `extension/dist/popup.js`; TypeScript/TSX loader, CSS loaders, `.env.local` via `dotenv-webpack`.
   - Background entry `./extension/background/index.ts` → `extension/dist/background.js`; TypeScript loader and `.env.local` via `dotenv-webpack`.
   - Content entry `./extension/content/index.ts` → `extension/dist/content.js`; TypeScript loader.
3. Add scripts:
   - `build:extension`: `webpack --config webpack.extension.js --mode production`
   - `dev:extension`: `webpack watch --config webpack.extension.js --mode development`
4. Install `style-loader` and `css-loader`.
5. Keep the existing application scripts usable; do not break the existing Next.js/Prisma build.
6. Commit as `chore: set up Webpack build for extension`.

**Verification:**
- The Webpack configuration module must load successfully.
- Every required dependency and script must be present.
- An actual bundle build is deferred until Tasks 6, 9, and 10 create the configured entry points.
