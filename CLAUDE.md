# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MITQC Dashboard — a React + Vite single-page app for internal QC inspection records (`README.md`: "Internal web app for employees"). It talks to a Google Sheet through a Google Apps Script web app (`Code.gs`) as its only backend; there is no other server and no client-side persistence (no localStorage) — every read/write goes over the network.

This repo is separate from the sibling Google Apps Script QC project one directory up (`../CLAUDE.md`, `../Code.gs`, `../Index.html`) — do not conflate the two.

## Files

- `index.html` — Vite entry point: loads Google Fonts, mounts `<div id="root">`, and boots `src/main.jsx`. Not page structure — that lives in the React components.
- `src/main.jsx` — React root, imports `src/index.css`.
- `src/App.jsx` — top-level layout: renders `Sidebar`, the active panel (`Home` / `InspectionForm` / `Reports`), and the `Toast`. Owns `activePanel` and toast state.
- `src/api.js` — the only place that talks to the Apps Script backend. `listRecords()` and `saveRecord(record)`, both plain `fetch()` GET requests (see "Backend" below).
- `src/components/` — small presentational pieces: `Sidebar.jsx`, `Toast.jsx`, `Badge.jsx` (status pill).
- `src/pages/` — one component per panel: `Home.jsx` (stats + recent-10 table), `InspectionForm.jsx` (the New Inspection form), `Reports.jsx` (filters, charts, full table, CSV export).
- `src/index.css` — all styling: Apple-light theme, glass-card/table/chart/toast styling, responsive breakpoints. Global stylesheet, not CSS modules.
- `Code.gs` — the Apps Script backend. Deployed via `clasp` (`.clasp.json`/`.claspignore`), not by the Vite build — see "Backend". Handles `?action=list`, `?action=save`, and `?action=findRouteCard` over GET, returns plain JSON.
- `appsscript.json` — the Apps Script project manifest (timezone, webapp execute-as/access settings), pulled/pushed by `clasp` alongside `Code.gs`.
- `.github/workflows/deploy.yml` — builds with Vite and deploys `dist/` to GitHub Pages via `actions/deploy-pages` on every push to `main`.
- `AGENTS.md` — the pre-existing agent instructions for this repo (Codex-style); keep it in sync with this file if conventions change.

## Commands

```
npm install     # once, or after dependency changes
npm run dev     # Vite dev server with HMR
npm run build   # production build to dist/
npm run preview # serve the dist/ build locally
```

To validate a change: run `npm run dev`, exercise the changed workflow in the browser (add a record via the form, switch to Reports to confirm it round-tripped through the Sheet, check filters/charts, export CSV), and check the browser console for errors. `npm run build` should also succeed before considering a change done — GitHub Actions will fail the deploy otherwise.

This repo has no test suite. There's no lint config either; match the existing code style.

## Architecture

### Storage model

There is no client-side persistence layer. `src/api.js` is the single source of truth for reading and writing records — `listRecords()` fetches the full sheet as an array of row objects (keyed by the sheet's column headers, e.g. `r['Inspection Date']`), and `saveRecord(record)` appends one row. Both pages (`Home`, `Reports`) call `listRecords()` fresh on mount; there is no shared cache, so navigating to either panel always reflects the latest sheet state.

### Backend (Google Apps Script)

`Code.gs` lives in a separate Apps Script project (bound to the "MITQC" Google Sheet), linked to this repo via `.clasp.json` (`scriptId`) and `clasp` (Google's official Apps Script CLI, a devDependency here). A commit to this repo does **not** update the live endpoint by itself — after editing `Code.gs`, push and deploy explicitly:

```
npx clasp push                                    # uploads Code.gs + appsscript.json
npx clasp deployments                             # list deployments, find the one matching API_URL in src/api.js
npx clasp deploy -i <deploymentId> -d "message"   # redeploy that same deployment (keeps the same /exec URL)
```

`clasp login` requires an interactive browser OAuth flow tied to a specific Google account — it must be run once by a human with access to the account that owns the Apps Script project (currently `QC-Fadrul@mit-mfg.com`), not something that can be scripted unattended. `.claspignore` restricts what `clasp push` uploads to just `Code.gs` and `appsscript.json` (the repo root also holds the unrelated React app, which Apps Script has no use for).

`doGet(e)` branches on `e.parameter.action`: `list` returns all sheet rows as JSON, `save` appends a row built from the query parameters. Both go over plain GET — no JSONP, no POST. This works because Apps Script web app responses already carry permissive CORS headers for simple GET requests (no custom headers, no non-simple content type), so `fetch()` can read the response directly; POST would trigger a CORS preflight that Apps Script doesn't handle, which is why `save` is also a GET (with the record fields as query params) rather than a POST body.

### Record field names are load-bearing across three places

A QC record uses lowercase field names on the way out to the API (`date`, `routecard`, `po`, `drawing`, `part`, `qtypo`, `material`, `nextprocess`, `inspector`, `status`, `partstatus`, `qtyok`, `qtyng`, `short`, `ncr`, `ncrstatus`, `remark`), and comes back keyed by the sheet's actual column headers (`Inspection Date`, `Route Card`, `PO#`, `Drawing No.`, `Part Description`, `Qty PO`, `Material`, `Next Process`, `Inspected By`, `Inspection Status`, `Part Status`, `Qty OK`, `Qty NG`, `Short`, `NCR`, `NC Status`, `Remark`). These must stay consistent across:

1. `src/pages/InspectionForm.jsx` — the form state object and its field-by-field `set('fieldname')` handlers, passed to `saveRecord()`.
2. `Code.gs`'s `saveRecord(params)` — the `fieldMap` that maps each lowercase param to its sheet column header.
3. Every reader of a fetched record: `src/pages/Home.jsx`, `src/pages/Reports.jsx` (table, filters, charts, CSV export `EXPORT_KEYS`).

Changing, adding, or removing a field means touching all three in the same change — there's no shared schema/constant to edit once, and `Code.gs` isn't type-checked against the frontend at all since it's edited and deployed independently.

### Panel navigation

`App.jsx` holds `activePanel` state (`'home' | 'form' | 'report'`) and conditionally renders exactly one of `Home` / `InspectionForm` / `Reports` — panels mount/unmount rather than staying mounted-but-hidden. This means each visit to Home or Reports triggers a fresh `listRecords()` call (matching the intended "always show latest data" behavior), but also means an unsaved New Inspection draft is lost if you navigate away and back.

### Reports: filtering, charts, export

`Reports.jsx` derives `statusOptions`/`materialOptions` from the distinct values in the fetched records, and a single `filtered` array (via `useMemo`, keyed on status/material/date-range state) that feeds the table, both charts, and CSV export — keep filtering logic there, not duplicated per consumer.

Charts use `react-chartjs-2` (`<Doughnut>`/`<Bar>`, backed by `chart.js`) — the library owns the mount/update/destroy lifecycle, so there's no manual `new Chart()`/`.destroy()` bookkeeping like a vanilla Chart.js integration would need. `ChartJS.register(...)` in `Reports.jsx` registers only the elements/scales actually used (`ArcElement`, `BarElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend`) — add to that list if a new chart type is introduced.

### Language/copy conventions

UI copy is fully English (converted from an earlier bilingual Malay/English mix at the user's explicit request, since the mixing read as inconsistent). Keep new copy in English — don't reintroduce Malay strings.

### Deployment

GitHub Pages serves the `dist/` output built by `.github/workflows/deploy.yml` on every push to `main` — the Pages source must be set to "GitHub Actions" in repo Settings (not "Deploy from a branch") for this to work. `vite.config.js` sets `base: '/MITQC-Dashboard/'` to match the project-pages subpath (`yuzza96.github.io/MITQC-Dashboard/`); changing the repo name or moving to a custom domain/user-page means updating that base path too.
