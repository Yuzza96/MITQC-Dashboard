# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MITQC Dashboard — a small static, framework-free browser app for internal QC inspection records (`README.md`: "Internal web app for employees"). There is no package manager, build script, test runner, or backend. Data persistence is entirely client-side via `localStorage`.

This repo is separate from the sibling Google Apps Script QC project one directory up (`../CLAUDE.md`, `../Code.gs`, `../Index.html`) — do not conflate the two. This app currently does not read or write the Google Sheet at all, despite `config.js` referencing one (see below).

## Files

- `index.html` — page structure only: sidebar nav, the three panels (Home / New Inspection / Reports), the form fields, the report table, chart canvases, toast, and the delete-confirm modal. Loads Chart.js and Google Fonts from CDNs, then `styles.css` and `app.js`.
- `app.js` — all runtime behavior: `localStorage` persistence, panel navigation, form submission, report filtering, Chart.js rendering, row deletion, CSV export, and "clear all" data wipe.
- `styles.css` — layout, theme variables, responsive breakpoints, glass-card/table/chart/toast/modal styling.
- `config.js` — defines `window.SHEET_CONFIG` (a Google Sheet ID/name and a `getSheetUrl()` CSV-export URL builder). **This is not wired into `app.js` or `index.html` at all** — it's loaded by nothing and read by nothing yet. Don't assume it's an active persistence layer; current reads/writes go through the `mitqc_records` localStorage key.
- `AGENTS.md` — the pre-existing agent instructions for this repo (Codex-style); keep it in sync with this file if conventions change.

## Commands

No build/lint/test tooling exists. To validate a change:

- Open `index.html` directly in a browser, or serve the folder with any static file server.
- Manually exercise the changed workflow: add a record via the form, refresh to confirm `localStorage` persistence, check report filters and charts, export CSV, and test delete / clear-all if touched.
- Check the browser console for errors and re-check at a narrow viewport after UI changes.
- Chart.js is loaded from a CDN (`cdn.jsdelivr.net`) — charts won't render without network access.

This is a plain GitHub-hosted repo (`origin` → `github.com/Yuzza96/MITQC-Dashboard`); there's no CI and no deploy step beyond pushing/serving the static files.

## Architecture

### Storage model

Everything lives in one `localStorage` key, `mitqc_records` (`app.js`), as a JSON array of record objects. `getRecords()`/`saveRecords()` are the only read/write paths; `addRecord()` prepends a new record with a generated `id` (stringified `Date.now()`) and `createdAt` timestamp. There is no server, no sync between devices/browsers, and no schema migration mechanism — a stored record's shape is whatever was written by the `app.js` version that created it.

### Record field names are load-bearing across four places

A QC record is a flat object with these keys: `date`, `routecard`, `po`, `drawing`, `part`, `qtypo`, `material`, `nextprocess`, `inspector`, `status`, `partstatus`, `qtyok`, `qtyng`, `short`, `ncr`, `ncrstatus`, `remark` (plus generated `id`/`createdAt`).

These keys must stay consistent across:
1. The form field IDs in `index.html` (`#f-date`, `#f-routecard`, ... — pattern `f-<fieldname>`).
2. The submit handler in `app.js` that reads each `#f-*` input into the `record` object.
3. Every renderer that reads record fields: `renderHome()`, `renderReportTable()`, `renderCharts()`.
4. The CSV export `headers`/`keys` arrays in the export handler.

Changing, adding, or removing a field means touching all four in the same change — there's no shared schema/constant to edit once.

### Panel navigation

Three panels (`#panel-home`, `#panel-form`, `#panel-report`) are toggled by adding/removing the `.active` class; sidebar buttons carry `data-panel` attributes that `showPanel()` matches against panel IDs (`panel-` + value). Switching to `home` or `report` triggers a re-render (`renderHome()` / `renderReport()`) — there's no persistent routing/URL state, and the form panel doesn't re-render on entry.

### Reports: filtering, charts, export

`renderReport()` populates the status/material filter `<select>` options from the distinct values currently in storage, then calls `renderReportTable()` and `renderCharts()`. `getFiltered()` is the single source of truth for the active filter (status, material, date range) and is reused by the table renderer, the chart renderer, and CSV export — filtering logic should be changed there, not duplicated per consumer.

Charts (`Chart.js`, doughnut for status counts, bar for top materials) are destroyed and recreated on every re-render (`charts.status`/`charts.material` held in a module-level `charts` object) rather than updated in place — follow that pattern for any new chart to avoid leaking Chart.js instances.

### Language/copy conventions

UI copy mixes Malay and English (e.g. "Tambah rekod baharu", "Simpan Rekod", toast messages in Malay) — preserve this existing bilingual style rather than translating wholesale in either direction.
