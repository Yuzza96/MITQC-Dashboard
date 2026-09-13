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
- Database: Google Sheets (Sheet ID: `16ancoOykw7JhYoBB-wh5QCmx-UG7xdQl1JMZPsmGTyI`)
- Backend: Google Apps Script web app (`Code.gs`) — plain JSON over GET, no JSONP/POST
- Hosting: GitHub Pages, built + deployed by `.github/workflows/deploy.yml` on push to `main`
- Charts: Chart.js via `react-chartjs-2`
- Icons: `lucide-react`
- Fonts: Google Fonts — Inter

## File Structure
```
MITQC-Dashboard/
├── index.html                    # Vite entry (div#root)
├── vite.config.js                # base: '/MITQC-Dashboard/'
├── package.json
├── .github/workflows/deploy.yml  # build + deploy to Pages
├── Code.gs                       # Apps Script backend (deployed separately — see below)
└── src/
    ├── main.jsx
    ├── index.css                 # all styling
    ├── App.jsx                   # sidebar + panel routing + toast state
    ├── api.js                    # listRecords() / saveRecord()
    ├── components/                # Sidebar, Toast, Badge
    └── pages/                     # Home, InspectionForm, Reports
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

## Dashboard Structure (3 panels)

### 🏠 Home
- Stats overview: Total Rekod, Quantity OK, Quantity NG, NCR Aktif
- Table: 10 rekod terbaru

### 📝 New Inspection (Form Input)
**Route Card section:**
- Inspection Date (date, required)
- Route Card No. (text, required)
- PO# (text)
- Drawing No. (text)
- Part Description (text, required)
- Qty PO (number)
- Material (text)
- Next Process (text)
- Inspected By (text)

**Inspection Result section:**
- Inspection Status (select: Pass / Fail / Conditional Pass / Pending)
- Part Status (select: Accept / Reject / On Hold)
- Quantity OK (number)
- Quantity NG (number)
- Short (number)
- NCR No. (text)
- NC Status (select: N/A / Open / In Review / Closed)
- Remark (textarea)

### 📊 Reports
- Charts: Inspection Status (doughnut) + Top Material (bar)
- Filters: Status, Material, Date range
- Table: semua rekod (read-only — no delete/edit yet)
- Export CSV button

## Data Storage
- **Backend**: Google Sheets, via a Google Apps Script web app (`Code.gs`)
- **Google Sheet**: `Inspection Records` tab, Sheet ID `16ancoOykw7JhYoBB-wh5QCmx-UG7xdQl1JMZPsmGTyI`
- **Apps Script URL**: see `API_URL` in `src/api.js`
- No client-side persistence (no localStorage) — every read/write hits the network.
- **Important**: `Code.gs` in this repo is a *copy* for review/history. Editing it here does nothing to the live endpoint — you must paste the change into the Apps Script editor and create a new deployment/version yourself.

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
- Google account (work): mit-mfg.com domain
- Google account (personal): peyo23dude@gmail.com

## Coding Conventions
- Guna Bahasa Melayu untuk UI labels dan toast messages
- Semua comments dalam English
- React function components + hooks only — no class components, no state management library (app is small enough for local `useState`/`useMemo`)
- Field names (form state ↔ API params ↔ sheet headers) must be kept in sync across `src/pages/InspectionForm.jsx`, `Code.gs`'s `fieldMap`, and every reader in `src/pages/Home.jsx` / `src/pages/Reports.jsx` — see `CLAUDE.md` for the full list
- Jangan guna localStorage untuk data production — guna Google Sheets sahaja
- Selepas buat sebarang perubahan: run `npm run build` to confirm it still builds, then `git add . && git commit -m "update" && git push`

## Current Status
- ✅ GitHub repo setup
- ✅ GitHub Pages live (via GitHub Actions build)
- ✅ Dashboard rebuilt on React + Vite (Home, New Inspection, Reports)
- ✅ Google Sheets integration working (plain fetch GET, no JSONP)
- ⏳ Row delete/edit from the Reports table (not implemented — table is read-only + CSV export only)
