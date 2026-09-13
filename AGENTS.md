# MITQC Dashboard — Project Brief

## Project Overview
Internal QC (Quality Control) web dashboard for MIT Manufacturing (mit-mfg.com).
Built with React + Vite. Hosted on GitHub Pages (free), deployed via GitHub Actions.

## Live URL
https://yuzza96.github.io/MITQC-Dashboard

## GitHub Repo
https://github.com/Yuzza96/MITQC-Dashboard

## Tech Stack
- Frontend: React + Vite
- Database: Google Sheets ("MITQC" spreadsheet, personal account — see "Data Storage")
- Backend: Google Apps Script web app (`Code.gs`), deployed/managed via `clasp`
- Hosting: GitHub Pages, built + deployed by `.github/workflows/deploy.yml` on push to `main`
- Charts: Chart.js via `react-chartjs-2` (loaded by Reports.jsx, currently unused — see "Current Status")
- Icons: `lucide-react`
- Fonts: Google Fonts — Inter

## File Structure
```
MITQC-Dashboard/
├── index.html                    # Vite entry (div#root)
├── vite.config.js                # base: '/MITQC-Dashboard/'
├── package.json
├── .github/workflows/deploy.yml  # build + deploy to Pages
├── Code.gs                       # Apps Script backend
├── appsscript.json               # Apps Script project manifest
├── .clasp.json                   # scriptId linking this repo to the Apps Script project
├── .claspignore                  # restricts `clasp push` to Code.gs + appsscript.json
└── src/
    ├── main.jsx
    ├── index.css                 # all styling
    ├── App.jsx                   # renders Sidebar + active panel + toast state
    ├── api.js                    # listRecords() / saveRecord() / findRouteCard()
    ├── components/                # Sidebar, Toast, Badge
    └── pages/                     # RouteCard (active); Home, InspectionForm, Reports (unused, kept for later)
```

## Design System
- **Aesthetic**: Apple-inspired light mode, glass cards
- **Background**: `#f5f5f7`
- **Surface**: `#ffffff`, cards with `box-shadow` + `border-radius: 16px`
- **Accent color**: `#007AFF`
- **Text**: `#1d1d1f` / muted `#6e6e73`
- **Success**: `#34C759` · **Danger**: `#FF3B30` · **Warning**: `#FF9500`
- **Font**: Inter (Google Fonts)
- **Sidebar width**: 240px (fixed, left side), collapses to icon-only under 900px

## Dashboard Structure

Staged rebuild in progress — sidebar currently has **one menu item only**:

### 📇 Route Card (active)
Search-only page (`src/pages/RouteCard.jsx`), not a data-entry form:
- "Register Route Card" card: Route Card No. input + Find/Reset
- Searches the **`WO#`** column in the `route card import range` tab (see "Data Storage")
- If the WO# has multiple revisions (rows), shows "This route card have multiple revision" with a button per REV; picking one re-searches with that revision
- Once resolved to one row, shows its details as a field/value list, limited to `IMPORT_DISPLAY_COLUMNS` in `Code.gs`: PO#, RFM / IHM / RGAF, PURPOSE / PROJECT, DRAWING NUMBER, PART DESCRIPTION, QTY PO, MATERIAL, COATING, COATING2, WO#, REV, QTY

### Deferred (code kept, not wired into App.jsx or Sidebar yet)
- **Home** (`src/pages/Home.jsx`) — stats overview + recent-10 table
- **New Inspection** (`src/pages/InspectionForm.jsx`) — the original "add new record" form (Route Card + Inspection Result sections)
- **Reports** (`src/pages/Reports.jsx`) — charts, filters, full table, CSV export

Add these back to `Sidebar.jsx`'s `NAV_ITEMS` and `App.jsx`'s panel switch as they're needed again.

## Data Storage

Two separate Google Sheets tabs, in one spreadsheet file named **"MITQC"** (personal Google account — the original company-domain sheet couldn't be used because of IMPORTRANGE cross-account permission issues):

- **`route card import range`** — fed by a live `IMPORTRANGE` formula from elsewhere. **Read-only from this app's side** (`findRouteCard()` in `Code.gs`) — never write to this tab; `appendRow`-ing into it would clash with the formula's spill range and produce `#REF!` errors on recalc.
- **`Inspection record`** — a separate, plain tab for form submissions (`saveRecord()`/`listRecords()` in `Code.gs`). Currently unused since the New Inspection form isn't wired into the UI yet (see "Dashboard Structure"), but the backend function still targets it.

**Apps Script URL**: see `API_URL` in `src/api.js`. No client-side persistence (no localStorage) — every read/write hits the network.

### Deploying `Code.gs` changes

`Code.gs` is linked to its Apps Script project via `clasp` (`.clasp.json`'s `scriptId`). A commit to this repo does **not** update the live endpoint — push and deploy explicitly:

```bash
npx clasp push                                    # uploads Code.gs + appsscript.json
npx clasp deployments                             # find the deployment ID matching API_URL
npx clasp deploy -i <deploymentId> -d "message"   # redeploy it (keeps the same /exec URL)
```

`clasp login` is a one-time interactive browser OAuth step tied to a specific Google account (currently `QC-Fadrul@mit-mfg.com`, the owner of the Apps Script project) — it can't be scripted unattended, but only needs to be run once per machine.

## Git Workflow
```bash
git add .
git commit -m "your message"
git push
```
Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with Vite and deploys `dist/` to GitHub Pages. Takes a couple of minutes; the repo's Settings → Pages → "Build and deployment → Source" must be set to **GitHub Actions** (not "Deploy from a branch") for this to work.

## Developer Info
- GitHub username: Yuzza96
- Company: MIT Manufacturing (mit-mfg.com)
- Google account (work): mit-mfg.com domain — owns the Apps Script project (`clasp login` identity)
- Google account (personal): peyo23dude@gmail.com — owns the "MITQC" spreadsheet

## Coding Conventions
- All UI labels and toast messages are English now (converted from a bilingual Malay/English mix at the user's request) - don't reintroduce Malay strings
- Semua comments dalam English
- React function components + hooks only — no class components, no state management library (app is small enough for local `useState`/`useMemo`)
- Jangan guna localStorage untuk data production — guna Google Sheets sahaja
- Never `appendRow`/write into `route card import range` — read-only, see "Data Storage"
- Selepas buat sebarang perubahan kat frontend: run `npm run build` to confirm it still builds, then `git add . && git commit -m "update" && git push`
- Selepas ubah `Code.gs`: `npx clasp push` + `npx clasp deploy -i <id>` (see above) — a git push alone does not update the live backend

## Current Status
- ✅ GitHub repo setup, GitHub Pages live (via GitHub Actions build)
- ✅ Dashboard rebuilt on React + Vite
- ✅ Switched to personal-account "MITQC" spreadsheet; `route card import range` (IMPORTRANGE, read-only) kept separate from `Inspection record` (form writes)
- ✅ Route Card search (single menu item) — WO# lookup with multi-revision picker
- ✅ `clasp` wired up for direct `Code.gs` push/deploy
- ⏳ Home / New Inspection / Reports — built, kept in `src/pages/`, not yet wired back into the sidebar
