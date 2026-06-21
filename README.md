# <img width="64" src="https://github.com/user-attachments/assets/11d3d416-95f9-492b-ba89-d4c14a74a18a" alt="FPC365 icon">  FPC365 — Fluent Persian Converter 365

A Chrome/Edge (Manifest V3) extension that converts Gregorian dates on Microsoft
platforms — Dynamics 365, SharePoint, OneDrive, Office, Outlook, Teams — into the
Persian (Jalali) calendar, and provides a (mock) UI translation layer.

This repository is a full TypeScript rewrite of the original JavaScript extension,
organized as an **onion / clean architecture** so that domain logic stays free of
browser and DOM concerns.

---

## Architecture

Dependencies point **inward**. Inner layers never import from outer layers.

```
core  ◄──  application  ◄──  presentation
  ▲             ▲
  └──── infra ──┘
```

| Layer | Folder | Responsibility | May depend on |
| --- | --- | --- | --- |
| **Core** | `core/` | Domain models, types, constants. Pure data, zero dependencies. | — |
| **Application** | `application/` | Use cases: date math (`Jalali`, `DateConverter`) and the content-script pipeline (`content/`). | core |
| **Infrastructure** | `infra/` | Adapters to the outside world: `storage` (chrome.storage), `i18n`, `messaging`, `translation`. | core |
| **Presentation** | `presentation/` | UI: popup, options, datepicker, reload banner, and styles. | core, application, infra |

```
FPC365-ts/
├── core/                       # domain models, types, constants (no deps)
│   ├── models.ts
│   └── constants.ts
├── application/                # use cases (depends only on core)
│   ├── Jalali.ts               # Jalali ⇄ Gregorian conversion helpers
│   ├── DateConverter.ts        # date parsing / text replacement (date-utils)
│   └── content/                # the content-script pipeline (split content.js)
│       ├── ContentController.ts # orchestrates settings, observer, messaging
│       ├── TextProcessor.ts     # walks & converts text nodes
│       ├── InputProcessor.ts    # converts/restores <input> values
│       ├── CollectionProcessor.ts # grids, calendar views, aria/title attrs
│       ├── DatePickerBridge.ts  # swaps native pickers for the Persian one
│       ├── ModificationTracker.ts # records DOM edits so they can be reverted
│       ├── ProcessingContext.ts
│       └── index.ts             # content-script entry point
├── infra/                      # adapters (depend on core)
│   ├── storage/SettingsRepository.ts
│   ├── i18n/                    # strings + runtime translation helpers
│   ├── messaging/messages.ts
│   └── translation/             # dictionary download + storage (stubs)
├── presentation/               # UI (depends on core/application/infra)
│   ├── generic/_generic.scss    # shared design tokens & mixins
│   ├── _content-text.scss       # injected-content styling
│   ├── content.scss             # content stylesheet entry → content.css
│   └── components/
│       ├── popup/               # popup.html / popup.ts / popup.scss
│       ├── options/             # options.html / options.ts / options.scss
│       ├── datepicker/          # datepicker.html / datepicker.ts / datepicker.scss
│       └── ReloadBanner/        # ReloadBanner.html / .ts / .scss
├── public/                     # static assets
│   ├── manifest.json
│   └── icons/
├── scripts/
│   ├── vite-build.mjs          # Vite (primary build) → dist/
│   └── build.mjs               # esbuild + sass fallback → dist/
├── tests/                      # Vitest unit tests (+ chrome mock setup)
├── types/assets.d.ts           # `*.html` module declaration
├── vite.config.ts              # shared Vite config (raw-HTML plugin, SCSS)
├── vitest.config.ts            # jsdom test env + coverage
├── tsconfig.json
└── package.json
```

---

## Build

The project is built with **Vite** (fix #7). Because MV3 content scripts must be
plain IIFEs (no ESM at runtime), `scripts/vite-build.mjs` drives Vite's library
mode once per entry (`content`, `popup`, `options`) and emits a flat `dist/`.

```bash
npm install         # install dev dependencies (vite, sass, vitest, esbuild, …)
npm run build       # Vite build → dist/   (primary)
npm run build:check # tsc --noEmit THEN build
npm run build:esbuild # esbuild + sass fallback build → dist/
npm run dev         # esbuild watch (fast incremental rebuilds)
```

> SCSS is imported directly from each entry (`import "./popup.scss"`), so Vite
> compiles and emits `popup.css` / `options.css` / `content.css` automatically.
> The esbuild fallback resolves those `.scss` imports to an empty module and
> compiles the stylesheets separately with `sass`.

The build produces a **flat `dist/` folder** that Edge/Chrome can load directly:

```
dist/
├── manifest.json
├── content.js      # bundled application/content/index.ts
├── content.css     # compiled presentation/content.scss
├── popup.html
├── popup.js        # bundled presentation/components/popup/popup.ts
├── popup.css
├── options.html
├── options.js      # bundled presentation/components/options/options.ts
├── options.css
└── icons/
```

- **TypeScript** is bundled into self-contained IIFE files (no ES imports remain
  at runtime, which is required for MV3 content scripts).
- **SCSS** is compiled by Vite (or `sass` in the fallback build).
- `.html` component templates are imported as raw text and inlined at build time
  (used by the ReloadBanner and the datepicker — fix #4) via a small Vite plugin
  in `vite.config.ts`.

---

## Testing

Unit tests use **Vitest** with the **jsdom** environment (fix #9). A chrome.*
mock and DOM reset live in `tests/setup.ts`.

```bash
npm test           # run the suite once
npm run test:watch # watch mode
npm run coverage   # V8 coverage report → ./coverage
```

Covered areas: Jalali date math, the date converter & field detection, i18n,
the settings repository (chrome.storage), the Persian datepicker, and the reload
banner. See [`tests/README.md`](./tests/README.md).

### Load the extension

1. Run `npm run build`.
2. Open `edge://extensions` or `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `dist/` folder.

---

## Features

- Gregorian → Persian (Jalali) date conversion across text, inputs, grids, and
  calendar views on supported Microsoft sites.
- Optional Persian digits and Persian month names.
- Optional embedded Persian datepicker that replaces native pickers.
- Tooltips showing the original value, and safe restore-on-save so the host app
  still receives Gregorian values.
- Popup quick-toggle + full options page with live preview.
- English/Persian interface language with RTL support.
- Mock dictionary manager (scaffolding for a future translation feature).

---

## Why vanilla TypeScript (not React)?

The heaviest part of this extension is the **content script**, which mutates the
host page's existing DOM (Dynamics/SharePoint/etc.). A virtual-DOM framework like
React adds no value there — and actually fights you — because you are editing
third-party nodes you don't own. So the content pipeline stays as small, testable
vanilla TS modules.

The **popup** and **options** pages are small, form-driven surfaces; plain TS with
the i18n helper keeps the bundle tiny and dependency-free. If these pages grow
significantly, they are isolated enough that they could be migrated to React (or
Preact, which is lighter for extensions) without touching `core`, `application`,
or `infra`.

---

---

## Support & Contact

**Created by:** Amir Qaribi  
**Website:** [AmirQaribi.ir](https://AmirQaribi.ir)  
**Email:** [AmirQaribi@outlook.com](mailto:AmirQaribi@outlook.com)

### Buy Me a Coffee ☕

If you find this extension useful and would like to support its development, feel free to buy me a coffee:

🔗 **TON Wallet:** [Send via Ton Transfer](https://ton.app/pay/transfer/UQDo5DO2ykJ3CySHbyfnDjl4f36EYggNDvHDiyYKQEakyURN?amount=2000000000&text=For%20a%20Coffee)

---

## Acknowledgments

This project was created with the assistance of **Claude Opus 4.8**, which helped bring the full vision of this extension to life.

---

## License

See [LICENSE.md](./LICENSE.md) — Dynamic Translate Personal Use & Collaboration License.
