# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Electron app in development mode
npm run build        # Build all three targets (main / preload / renderer)
npm run build:win    # Full Windows NSIS installer (runs build first)
npm run typecheck    # TypeScript type-check without emitting
npm run lint         # ESLint across all .ts/.tsx files
npm run format       # Prettier format
```

Always run `npm run build` after changes to verify there are no TypeScript errors — there are no unit tests; the build is the primary correctness gate.

## Architecture

This is an **Electron + React** desktop widget with three distinct build targets managed by `electron-vite`:

| Target | Entry | Output |
|--------|-------|--------|
| Main process | `electron/main/index.ts` | `out/main/index.js` |
| Preload | `electron/preload/index.ts` | `out/preload/index.js` |
| Renderer | `src/main.tsx` (root: `src/`) | `out/renderer/` |

### Key architectural constraint: CORS bypass via IPC

The TWSE stock API cannot be called from the renderer due to CORS. **All API calls must go through the main process** via IPC:

```
Renderer → window.api.fetchStocks(symbols)
         → contextBridge → ipcRenderer.invoke('fetch-stocks')
         → ipcMain.handle('fetch-stocks') → stockApi.ts (Node.js https)
         → returns StockInfo[]
```

- `electron/main/stockApi.ts` — TWSE API logic; requires `Referer: https://mis.twse.com.tw/` header
- `electron/preload/index.ts` — exposes `window.api.{ fetchStocks, detectMarket, minimizeWindow, closeWindow }`
- `src/types/electron.d.ts` — TypeScript types for `window.api`

### Transparent frameless window

`BrowserWindow` is configured with `transparent: true`, `frame: false`, `backgroundColor: '#00000000'`, `alwaysOnTop: true`. CSS sets `html, body, #root { background: transparent }`. Dragging is handled via `-webkit-app-region: drag` (`.drag-region`) and interactive elements inside drag zones must have `.no-drag`.

### Tailwind CSS v4

Uses CSS-first config — **no `tailwind.config.js`**. Import is `@import "tailwindcss"` in `src/index.css`. Plugin is `@tailwindcss/vite` added to the renderer's Vite plugins in `electron.vite.config.ts`. Custom utilities (`.glass`, `.drag-region`, `.no-drag`) are defined in `@layer utilities` in `src/index.css`.

### Taiwan stock color convention

Up (漲) → `text-red-400`, Down (跌) → `text-green-400`, Flat/after-hours → `text-gray-400`.

### Data flow in the renderer

`useStockData` hook (`src/hooks/useStockData.ts`):
- Loads symbol list from `localStorage` key `tsw-stocks`; falls back to `DEFAULT_SYMBOLS`
- Fetches on mount, then every 10 seconds via `setInterval`
- Accumulates a rolling price history (max 30 points per stock) in a `Map<string, number[]>` for sparkline charts
- Uses `useRef` to track the latest symbols inside the interval callback (avoids stale closure)

### TWSE API response fields

`msgArray[i]`: `c` = code, `n` = name, `z` = price (`"-"` when after-hours), `y` = yesterday close, `h` = day high, `l` = day low, `v` = volume, `ex` = `"tse"` | `"otc"`.

When `z === "-"` (`isAfterHours`), `price` is set to `y` (yesterday close) and `change`/`changePercent` are 0. Change and changePercent are always computed as `price - yesterdayClose` and `change / yesterdayClose * 100` directly — the `ch` API field is not used.
