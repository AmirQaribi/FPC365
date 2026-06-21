# Tests

Unit tests for FPC365, written with [Vitest](https://vitest.dev) (fix #9).

```bash
npm install        # installs vitest, jsdom, @vitest/coverage-v8, \u2026
npm test           # run the suite once
npm run test:watch # watch mode
npm run coverage   # run with V8 coverage report (./coverage)
```

## What is covered

| File | Subject |
| --- | --- |
| `jalali.test.ts` | Gregorian \u2194 Jalali conversion, month lengths, digit/format helpers |
| `dateConverter.test.ts` | String parsing, Persian conversion, in-text replacement |
| `detect.test.ts` | Date-field detection & skip heuristics (DOM) |
| `i18n.test.ts` | Translation lookup, document translation, language toggle |
| `settingsRepository.test.ts` | chrome.storage persistence, merge updates, reload signal, change events |
| `datepicker.test.ts` | Date-picker shell from the HTML template, rendering & selection |
| `reloadBanner.test.ts` | Reload banner injection, de-duplication, dismiss |

`setup.ts` provides an in-memory `chrome.*` mock and resets the DOM between tests.
The jsdom environment and the raw-HTML Vite plugin (shared with the build) let
the DOM-driven modules run unchanged.
