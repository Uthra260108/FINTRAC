# FINTRAC — Financial Instrument Tracking & Regulatory Administration Console

> **Tagline:** Every Deposit. Every Deadline. Under Control.  
> **Problem Statement Title:** Streamline of Security Deposit / FDR Portal  
> **Target Regulatory Body:** All India Council for Technical Education (AICTE)  
> **Evaluation Prototype:** Smart India Hackathon

---

## 1. Executive Summary & Project Background

The **All India Council for Technical Education (AICTE)** requires a systematic mechanism to manage statutory security deposits and Fixed Deposit Receipts (FDRs) associated with regulatory approval, establishment of new technical institutions, and course extensions.

Under conventional manual and fragmented tracking:
- Institution-wise FDR records become difficult to locate or verify across regional offices.
- Missing or incomplete financial instrument details and joint-lien endorsements create compliance gaps.
- Monitoring critical maturity and expiry dates is labor-intensive and prone to administrative delay.
- Rollovers, renewals, and course-closure release petitions suffer from lack of centralized status tracking.
- Repetitive administrative overhead delays the identification of discrepancies between bank guarantees and regulatory requirements.

**FINTRAC** resolves these challenges by introducing a centralized, institutional-grade digital platform for managing the entire lifecycle of security deposits and FDRs—from registration and document scrutiny to automated maturity tracking, renewals, and orderly release.

---

## 2. Technical Stack & Architecture

This application is built as a **frontend-only, zero-dependency prototype** designed for immediate static deployment on **Vercel** and source code management on **GitHub**.

### Technologies Used:
- **HTML5:** Semantic architecture, accessible forms, responsive viewports.
- **CSS3:** Custom luxury design system using CSS custom properties, grid layouts, fluid typography, and print stylesheets.
- **Vanilla JavaScript (ES6+):** Pure client-side application logic with zero external JavaScript frameworks.
- **HTML5 Canvas:** Native zero-dependency data visualization charts for portfolio lifecycle, bank exposures, and maturity countdowns.
- **Browser localStorage:** Resilient client-side state management storing institutions, FDR dossiers, scrutiny observations, renewal links, release cases, and audit trails.

### Strictly Excluded (As Mandated):
- No React, Angular, Vue, or modern bundlers.
- No Node.js runtime, Java, PHP, Python, or Spring Boot.
- No MySQL, Firebase, Supabase, or external database server dependencies.

---

## 3. Design System & Color Palette

FINTRAC employs a sophisticated, institutional-grade financial design identity:

| Tone / Token | Hex Code | Purpose & Application |
|---|---|---|
| **Forest Green** | `#445D48` | Primary brand accent, navigation bars, primary CTA buttons, active/compliant badges |
| **Soft Peach** | `#FDE5D4` | Background warmth, subtle fill highlights, card tints, accent borders |
| **Muted Olive** | `#D6C699` | Secondary cards, statistical highlights, borders, and warning status |
| **Deep Midnight Navy** | `#001524` | Primary high-contrast headings, main interface text, and authoritative titles |
| **Dark Terracotta** | `#5E3023` | Critical warnings, overdue maturity alerts, discrepancies, and destructive actions |

### Typography & Aesthetics:
- **Display Headings:** *Cinzel* / *Playfair Display* (Sophisticated serif typography for authoritative financial headings).
- **Interface UI:** *Plus Jakarta Sans* / modern system sans-serif (High-readability, crisp forms, and responsive tables).
- **Micro-interactions:** Subtle box-shadows, refined 1px borders, smooth transitions, and distinct status dot indicators.

---

## 4. User Roles & Demo Credentials

FINTRAC provides three distinct, interconnected workspaces with **1-click autofill credentials** on the login page:

### A. AICTE Regulation Bureau Administrator
- **Username:** `admin`
- **Password:** `admin123`
- **Assigned Workspace:** [admin.html](admin.html)
- **Permissions:** Full oversight over ₹245+ Crore across 1,200+ technical institutions, review scrutiny observations, monitor maturity escalations, authorize renewals, and grant simulated releases.

### B. Institution Administrator
- **Username:** `mit`
- **Password:** `mit123`
- **Assigned Workspace:** [institution.html](institution.html)
- **Represented Entity:** Maharashtra Institute of Technology (MIT-WPU), Pune
- **Permissions:** Register new FDRs with document upload simulation, track impending maturities, edit permitted branch/holder details, file renewal instruments, and submit release/refund petitions.

### C. Authorized Reviewer (Scrutiny Demonstration)
- **Username:** `reviewer`
- **Password:** `review123`
- **Assigned Workspace:** [reviewer.html](reviewer.html)
- **Permissions:** Review assigned scrutiny queue, perform side-by-side comparison between institution-submitted receipts and independent confirmation, and record formal scrutiny determinations.

---

## 5. Complete 12-Step FDR Lifecycle

FINTRAC tracks each statutory deposit through a 12-stage state progression:
```
1. Draft Created
   └── 2. Submitted by Institution
       └── 3. Awaiting Review
           └── 4. Under Verification
               ├── 5. Verified in Demo
               └── 6. Discrepancy Identified ──> Remedial Correction
                   └── 7. Renewal Required
                       └── 8. Renewal Submitted
                           └── 9. Renewed (Active Rollover)
                               └── 10. Release Requested
                                   └── 11. Release Under Review
                                       └── 12. Released in Demo
```

Every transition updates the parent instrument, recalculates countdown parameters, and records an immutable log entry in the audit trail.

---

## 6. Key Modules & Functional Highlights

1. **Automated Maturity Engine (`js/maturity.js`):**
   - Real-time JavaScript `Date` differential calculation from system clock.
   - Dynamic buckets: Overdue / Matured (`< 0 days`), Expiring Soon (`1–30 days`), Approaching (`31–90 days`), and Active (`> 90 days`).
   - Configurable reminder simulator triggering alerts for 90, 60, 30, and 7-day thresholds.
   - Excludes released instruments to prevent false reminders.

2. **Scrutiny Workbench (`js/verification.js`):**
   - Side-by-side visual comparison panel:
     - **Left:** Institution-Submitted Details (FDR No., Bank, Branch, Amount, Dates, Document PDF).
     - **Right:** Independently Confirmed Info (Explicitly labeled *"Not connected — demo only"*).
   - Scrutiny actions: *Information Complete*, *Missing Information*, *Discrepancy Found*, *Further Verification Required*, *Verified in Demo*.

3. **Renewal & Replacement Linkage (`js/renewal.js`):**
   - Explicit parent-child relational linkage between expired original FDR and replacement instrument.
   - Preserves historical rollover audit log with amounts and tenures.

4. **Release & Refund Approval Workflow (`js/release.js`):**
   - Manages formal refund petitions, course closure council NOCs, and student clearance orders.
   - Simulated administrative order granting with lien revocation notices.

5. **Reports & Zero-Dependency Analytics (`js/reports.js`):**
   - Pure HTML5 Canvas donut chart (lifecycle status distribution).
   - Canvas bar chart (bank-wise deposit exposure).
   - Canvas column chart (maturity countdown distribution).
   - Dynamic CSV export and clean print stylesheet (`@media print`).

6. **Immutable Audit History (`js/audit.js`):**
   - Reverse-chronological activity log recording timestamp, user role, action, previous status, new status, and remarks.

---

## 7. Project File Structure

```
FINTRAC/
├── index.html               # Public Landing Page (Features, Portals, Lifecycle)
├── login.html               # Multi-Role Authentication with 1-Click Autofill
├── admin.html               # AICTE Regulation Bureau Command Centre
├── institution.html         # Institution Financial Workspace (MIT Pune Demo)
├── reviewer.html            # Authorized Reviewer / Bank Scrutiny Portal
├── fdr-records.html         # Central FDR Registry with Advanced Filters
├── add-fdr.html             # New Security Deposit Registration Form
├── verification.html        # Document Scrutiny Workbench
├── maturity.html            # Automated Maturity Monitoring Matrix
├── renewal.html             # FDR Replacement & Rollover Tracking
├── release-requests.html    # Release & Refund Approval Workflow
├── alerts.html              # Regulatory Escalation & Alert Centre
├── reports.html             # Native Canvas Analytics & CSV Reporting
├── audit.html               # Immutable Activity Audit Trail
├── profile.html             # Institutional Entity Profile & Settings
├── vercel.json              # Clean URL Configuration for Vercel
├── README.md                # Comprehensive Documentation & Deployment Guide
├── css/
│   ├── style.css            # Base design system, CSS variables, typography, modals
│   ├── dashboard.css        # Sidebar, topbar, metric cards, tables, scrutiny panels
│   ├── forms.css            # Form controls, validation states, file dropzones
│   └── responsive.css       # Mobile drawer, adaptive tables, print media styles
├── js/
│   ├── storage.js           # Core state engine, seed records, dynamic dates, CRUD
│   ├── auth.js              # Role-based access control, sessions, quick-switcher
│   ├── app.js               # Global UI helpers, toast engine, modal manager, CSV
│   ├── admin.js             # AICTE Command Centre metrics & activities
│   ├── institution.js       # Institution workspace metrics & FDR tables
│   ├── fdr.js               # FDR registry, filters, 12-stage lifecycle modal
│   ├── maturity.js          # Live date differential calculator & reminder engine
│   ├── verification.js      # Scrutiny workbench & discrepancy logger
│   ├── renewal.js           # Replacement linkage & rollover history
│   ├── release.js           # Release/refund case management
│   ├── alerts.js            # Live notification generator from maturity data
│   ├── reports.js           # Native HTML5 Canvas charts & CSV exporter
│   └── audit.js             # Action logger & chronological audit viewer
└── sample-data/
    └── sample-fdr-dataset.json # Seed reference schema
```

---

## 8. Step-by-Step GitHub & Vercel Deployment Guide

### A. Uploading to GitHub
1. Open your terminal or PowerShell in the `FINTRAC` directory:
   ```bash
   cd c:\Users\uthra\OneDrive\Desktop\FINTRAC
   ```
2. Initialize git repository (if not already initialized):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: FINTRAC Security Deposit Portal Prototype"
   ```
3. Create a new repository on your GitHub account (e.g. named `fintrac-portal`).
4. Link and push to GitHub:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/fintrac-portal.git
   git push -u origin main
   ```

### B. Connecting to Vercel (Instant 1-Minute Deployment)
1. Sign in to [Vercel](https://vercel.com) using your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Select your `fintrac-portal` repository from the list and click **"Import"**.
4. In the Project Configuration:
   - **Framework Preset:** Select **"Other"**.
   - **Root Directory:** `./` (Leave as default).
   - **Build Command:** Leave blank (Pure static site, no build step required).
   - **Output Directory:** Leave blank.
5. Click **"Deploy"**.
6. Within 15 seconds, Vercel will deploy your application to a live public URL (e.g. `https://fintrac-portal.vercel.app`).

---

## 9. Testing & Demonstration Checklist

Before presenting to evaluators, verify the following workflows:
- [x] **Public Landing Page Navigation:** Verify responsive navbar, problem statement breakdown, and portal cards.
- [x] **1-Click Demo Login:** Click *Admin*, *Institution*, or *Reviewer* demo buttons to test role-specific workspaces.
- [x] **Add New FDR:** Register a deposit with deposit amount validation and date checks (`Maturity > Issue`).
- [x] **File Dropzone Simulation:** Select a PDF file and verify metadata display.
- [x] **Automated Maturity Monitoring:** Verify dynamic days countdown and 90/60/30/7-day threshold filters.
- [x] **Document Scrutiny Workbench:** Open an instrument, compare submitted details against simulated bank records, and save observations.
- [x] **Renewal Rollover:** Submit a replacement instrument and verify the parent-child linkage in the audit history.
- [x] **Release Petition:** Submit a course-closure release request and approve in demo.
- [x] **Native Canvas Charts:** Inspect Donut, Bar, and Horizon charts on the Reports page.
- [x] **CSV Export & Print:** Click "Export CSV" and "Print Dossier".
- [x] **Demo Data Reset:** Click "Reset Demo Data" in the top banner to restore original seed state at any time.

---

## 10. Prototype Demonstration Disclaimer

> ⚠️ **IMPORTANT NOTICE:**  
> FINTRAC is an architectural and functional prototype developed for educational and hackathon evaluation. All banking validations, core banking references, SFMS messages, and regulatory releases are simulated demonstration operations. The application does not execute live financial transactions or communicate with production AICTE or banking servers.
