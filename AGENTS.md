# AGENTS.md

## Cursor Cloud specific instructions

This is a **React Native native module library** (not a standalone app). The core dev loop runs entirely in Node.js — no mobile SDK or emulator is needed.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Lint | `pnpm run lint` |
| Unit tests | `pnpm test` |

- **Lint** runs ESLint on `index.js` only (the library entry point).
- **Unit tests** use Jest with mocked `react-native` (see `__mocks__/react-native.js`). All 27 tests run in Node.js without any native dependencies.
- The `playground/` directory contains an Expo demo app. It requires Android SDK or Xcode to build and is **not runnable** on a headless Linux cloud VM.
- E2E tests (`.maestro/`) require a running emulator/simulator and are also not runnable in this environment.
