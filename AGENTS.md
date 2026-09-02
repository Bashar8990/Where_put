# Project: where-did-i-put-it (وين حطيته؟)

Arabic PWA for recording where you put things. Local-first, offline, no backend.

## Commands
- `npm run dev` — dev server
- `npm run build` — typecheck + production build
- `npm run typecheck` — tsc strict, no emit
- `npm run test` — vitest (fake-indexeddb)
- `npm run lint` — oxlint
- `npm run icons` — regenerate PWA PNG icons

## Stack
React 19 + TypeScript (strict) + Vite + Tailwind v4 + Dexie (IndexedDB) + React Router (HashRouter) + vite-plugin-pwa + Zod + JSZip (dynamic import) + Lucide.

## Conventions
- All UI text in Arabic, RTL (`dir="rtl"` on `<html>`).
- No backend/API/analytics/tracking/AI. All data stays local in IndexedDB.
- Images stored as Blob in IndexedDB (not Base64). Compressed via Canvas to WebP/JPEG (max 1600px).
- Soft-delete with undo toast, then purge after timeout.
- Backup = ZIP (manifest.json + items.json + settings.json + images/), validated with Zod.
- Search uses normalized Arabic text (buildSearchText) stored in `searchText` field.

## Verification before considering work done
Run: `npm run typecheck && npm run test && npm run lint && npm run build` — all must pass with 0 errors.
