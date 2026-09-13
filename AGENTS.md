# MITQC Dashboard — Project Brief

## Project Overview
Internal QC (Quality Control) web dashboard for MIT Manufacturing (mit-mfg.com).
Built with plain HTML, CSS, and JavaScript. Hosted on GitHub Pages (free).

## Live URL
https://yuzza96.github.io/MITQC-Dashboard

## GitHub Repo
https://github.com/Yuzza96/MITQC-Dashboard

## Tech Stack
- Frontend: HTML + CSS + JavaScript (vanilla, no framework)
- Database: Google Sheets (Sheet ID: `16ancoOykw7JhYoBB-wh5QCmx-UG7xdQl1JMZPsmGTyI`)
- Hosting: GitHub Pages (auto-deploy dari branch `main`)
- Charts: Chart.js (CDN)
- Fonts: Google Fonts — Inter

## File Structure
```
MITQC-Dashboard/
├── index.html      # Main HTML — struktur dashboard
├── styles.css      # Semua styling — liquid glass aesthetic
├── app.js          # Semua logic — navigation, form, charts, data
└── AGENTS.md       # This file — project context
```

## Design System
- **Aesthetic**: Liquid glass / glassmorphism
- **Background**: Dark navy (#07111f) dengan radial gradient biru & purple
- **Glass effect**: `backdrop-filter: blur(24px) saturate(180%)`
- **Glass bg**: `rgba(255,255,255,0.10)`
- **Glass border**: `rgba(255,255,255,0.18)`
- **Accent color**: `#4f8ef7` (biru)
- **Text**: `#eef2ff`
- **Text muted**: `rgba(238,242,255,0.55)`
- **Success**: `#4ade80`
- **Danger**: `#f87171`
- **Font**: Inter (Google Fonts)
- **Border radius**: 16px (cards), 10px (buttons/inputs)
- **Sidebar width**: 240px (fixed, left side)

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
- Table: semua rekod dengan delete button
- Export CSV button

## Data Storage
- **Current**: localStorage (browser) — data simpan dalam browser user
- **Plan**: Migrate ke Google Sheets sebagai backend
- **Google Sheet**: `Inspection Records` tab
- **Sheet ID**: `16ancoOykw7JhYoBB-wh5QCmx-UG7xdQl1JMZPsmGTyI`
- **Apps Script URL**: `https://script.google.com/a/macros/mit-mfg.com/s/AKfycby7qkGJq3_2pNLWLfaG8TOa9Wf2erbmSF9ZLKVyTQnLg3rZTY2BqmgyDUzwOqXOkA1T/exec`

## Git Workflow
```bash
git add .
git commit -m "your message"
git push
```
GitHub Pages auto-update dalam 1-2 minit selepas push.

## Developer Info
- GitHub username: Yuzza96
- Company: MIT Manufacturing (mit-mfg.com)
- Google account (work): mit-mfg.com domain
- Google account (personal): peyo23dude@gmail.com

## Coding Conventions
- Guna Bahasa Melayu untuk UI labels dan toast messages
- Semua comments dalam English
- Jangan guna framework (React, Vue, etc.) — vanilla JS sahaja
- Jangan guna localStorage untuk data production — guna Google Sheets
- Selepas buat sebarang perubahan, run: `git add . && git commit -m "update" && git push`

## Current Status
- ✅ GitHub repo setup
- ✅ GitHub Pages live
- ✅ Dashboard UI siap (Home, New Inspection, Reports)
- ✅ localStorage working
- ⏳ Google Sheets integration (belum buat)
- ⏳ Form submission ke Google Sheets (belum buat)
