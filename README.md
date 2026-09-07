# WordTrack

> *A centralized daily word game tracker, discovery hub, and performance journal.*

[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite 6](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase 12](https://img.shields.io/badge/Firebase-12.0-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](LICENSE)
[![Live App](https://img.shields.io/badge/Live_Demo-wordtrack--app.vercel.app-000000?style=flat-square&logo=vercel&logoColor=white)](https://wordtrack-app.vercel.app)

🚀 **Live Website:** [https://wordtrack-app.vercel.app](https://wordtrack-app.vercel.app)

---

## 1. Overview & Problem Statement

Daily online word puzzle players frequently engage with multiple standalone games each morning—such as **Wordle**, **Connections**, **Quordle**, **Octordle**, **Contexto**, and **Weaver**. However, players encounter substantial fragmentation:

- **Scattered Progress**: No unified platform tracks multi-game daily routines, leaving streaks disconnected across isolated browser cookies and tabs.
- **Incompatible Game Mechanics**: Standard score trackers assume a binary win/loss or basic attempt counter, failing to accommodate multi-board clears, unlimited step deductions, categorical grouping mistakes, or numeric high scores.
- **Zero Centralized History**: Daily records vanish whenever local browser caches are cleared, preventing long-term analytical tracking or review.

**WordTrack** solves this by delivering a centralized command hub:
- **Zero-Pollution Guest Slate**: Unauthenticated guests experience an uncluttered empty slate without unrequested default lists. Favoriting and score tracking require authentication to guarantee strict user isolation.
- **Cloud Synchronization**: User profiles, custom favorite catalogs, and score journals synchronize in real-time across devices using Google Cloud Firestore.
- **Universal Category Engine**: A polymorphic logging system tailored to the distinct rule sets of all major daily word game archetypes.

---

## 2. Core Features Matrix

### Daily Hub & Live Tracker
- **Real-Time Routine Progress**: Visual progress bar tracking daily completion percentages with active remaining vs. completed game splits.
- **One-Click Play Launches**: Direct links opening official puzzle platforms in external tabs with seamless score-logging shortcuts upon return.
- **Continuous Streak Algorithm**: Calculates unbroken streaks using yesterday/today calendar continuity, preventing streak loss if games are logged later in the active day.
- **Dynamic Action Badges**: High-contrast indicators displaying status outcomes (e.g., `Solved (4/6)`, `Solved (16/16)`, `Failed (2/4 groups)`, `1,450 pts`).

### Dynamic Category Engine
WordTrack normalizes 6 distinct game mechanic archetypes:
- **Classic Single-Board** *(e.g., Wordle, Word500)*: Binary outcome (Solved vs. Unsolved) with attempt counters relative to a maximum limit (e.g., `4/6`).
- **Multi-Board Grid** *(e.g., Quordle, Octordle, Sedecordle)*: Dual metrics tracking total boards cleared (e.g., `7/8`) and total collective attempts consumed.
- **Unlimited Steps / Ladder** *(e.g., Contexto, Semantle, Weaver)*: Non-binary completion logs with custom metric units (such as "Guesses" or "Steps") where step count is the sole indicator of efficiency.
- **Grouping & Deduction** *(e.g., Connections, Swapple)*: Category deduction tracking recording exact groups cleared (`0–4`) alongside mistakes made (`0–4`).
- **High Score / Timed** *(e.g., SpellTower, Squaredle)*: Automatic victory logging capturing numeric point values and custom score units (e.g., `pts`, `words`).
- **Casual / Practice** *(e.g., Absurdle, Squabble)*: Non-loggable play launches for unranked practice and continuous bot matches.

### Performance Diary & Heatmap Calendar
- **Interactive Calendar Heatmap**: Monthly calendar with color-coded daily activity dots reflecting engagement and daily clear volume.
- **Aggregated Analytics**: Win percentages, total games solved, historical distribution of attempts, and category-level breakdown charts.
- **Intelligent Share-Text Parser**: Smart clipboard detection parsing native share strings (e.g., `Wordle 1,142 4/6*` or `Connections Puzzle #420`) directly into structured log modal fields.
- **Batch History Operations**: Safe log filtering, single-log editing, and batch-deletion capabilities with confirmation safeguards.

### Role-Based Admin Management & Community Submissions
- **4-Step Game Proposal Wizard**: Structured community submission flow gathering title, category mechanic, play URL, author credit, and category-specific rules.
- **Admin Review Queue**: Moderation dashboard enabling administrators to inspect, test, approve, or reject submissions with structured feedback notes.
- **Dynamic Catalog Seeding**: Seed tool enabling authorized administrators to populate verified puzzle collections and configure category metadata instantly.

### Enterprise Security & Data Isolation
- **Authenticated-Only Starring**: Guest interactions trigger friendly modal guidance to maintain strict user-level data boundaries.
- **Zero Cross-Session Inheritance**: Logging out purges all cached local identifiers, ensuring secondary accounts on shared devices never inherit leftover favorites.
- **Hardened Firestore Security Rules**: Granular role-based access control (RBAC) validating identity tokens, email verification states, and document ownership.

---

## 3. System Architecture & Tech Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 6 | High-performance single-page architecture and build tooling |
| **Styling & Design System** | Tailwind CSS v4, Lucide Icons | Dark slate palette, mathematical bento card spacing, responsive typography |
| **Motion & Micro-interactions** | Motion (`motion/react`), Canvas-Confetti | Fluid modal transitions, progress bar dynamics, celebratory victory confetti |
| **Backend & Cloud Services** | Firebase Authentication, Cloud Firestore | User credential management, real-time snapshot listeners, and persistent document storage |
| **Hosting & CI/CD** | GitHub Actions, Vercel | Automated continuous integration, preview deployments, and edge asset delivery |

---

## 4. Project Directory Structure

```text
wordtrack/
├── public/                 # Static assets & vector graphics (WordTrack 7-tile checkmark logo & favicon)
│   ├── favicon.svg
│   └── logo.svg
├── src/
│   ├── components/         # Modular UI components
│   │   ├── admin/          # Admin moderation tables, category managers & game forms
│   │   ├── auth/           # Authentication modals, password recovery & user profile badges
│   │   ├── browse/         # Discovery catalog grid, search filters & category navigation
│   │   ├── dashboard/      # Daily routine hub, remaining/completed sections & score log modal
│   │   ├── diary/          # Heatmap calendar, daily summary breakdown & history stats
│   │   ├── layout/         # Edge-to-edge navbar, sticky footer & mobile tab bars
│   │   ├── submissions/    # Community game submission modals & user contribution views
│   │   └── ui/             # Design primitives (Modal, Button, Input, Badges, WordTrackLogo)
│   ├── context/            # AuthContext (single source of truth for user authentication & favorites)
│   ├── hooks/              # Custom React hooks for responsive states & lifecycle listeners
│   ├── lib/                # Firebase client initialization, seed collections & formatting helpers
│   ├── pages/              # Primary route views (Dashboard, Browse, Diary, Submissions, Admin)
│   ├── services/           # Firestore data access layer (games, categories, logs, submissions)
│   └── types/              # Strict TypeScript definitions, data models & game schemas
├── firestore.indexes.json  # Cloud Firestore composite query indexes
├── firestore.rules         # Hardened Firestore security rules with RBAC enforcement
├── index.html              # HTML5 application shell & font declarations
├── metadata.json           # Application identity & capability flags
├── package.json            # Project manifest, scripts & dependencies
├── tsconfig.json           # Strict TypeScript configuration
└── vite.config.ts          # Vite build pipeline and plugin declarations
```

---

## 5. Getting Started & Local Development

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher (or `bun` / `pnpm`)
- **Firebase Project**: A Google Cloud project with **Authentication** (Email/Password & Google Sign-In) and **Cloud Firestore** enabled.

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RoshmikAgrawal/WordTrack.git
   cd WordTrack
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Firebase Environment**:
   WordTrack retrieves Firebase credentials from `firebase-applet-config.json` or standard environment variables. Create a `.env.local` file in the project root if using client environment variables:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   ```

4. **Launch the development server**:
   ```bash
   npm run dev
   ```
   The local dev server runs on `http://localhost:3000`.

5. **Perform static analysis & type checks**:
   ```bash
   npm run lint
   ```

6. **Generate production build artifacts**:
   ```bash
   npm run build
   ```

---

## 6. Firestore Security Rules & Composite Indexes

WordTrack enforces a strict defense-in-depth security model within `firestore.rules`:

- **Identity & Ownership Verification**: Users can only create, read, update, and delete their own profile documents (`/users/{userId}`) and score logs (`/game_logs/{logId}`).
- **Verified Admin Authority**: Administrative permissions (modifying categories, managing catalog games, and approving submissions) require an authenticated session where `request.auth.token.email_verified == true` matching registered administrator credentials.
- **Immutable Submission Ingestion**: Community submissions are write-once by authenticated users (`create` allowed with author UID verification; `update` and `delete` reserved exclusively for administrators).

### Required Composite Indexes
To support compound queries across dates and user accounts, deploy the following indexes defined in `firestore.indexes.json`:

| Collection Group | Field 1 | Field 2 | Scope |
| :--- | :--- | :--- | :--- |
| `game_logs` | `userId` (Ascending) | `playedDate` (Descending) | Collection |
| `game_submissions` | `userId` (Ascending) | `submittedAt` (Descending) | Collection |

Deploy indexes directly via the Firebase CLI:
```bash
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

---

## 7. Deployment Workflow (Vercel)

WordTrack is designed for continuous deployments on **Vercel** and is hosted live in production at [https://wordtrack-app.vercel.app](https://wordtrack-app.vercel.app):

1. **Connect Repository**: Link the GitHub repository in the Vercel Dashboard.
2. **Framework Preset**: Select **Vite** as the build framework preset.
3. **Build & Output Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Environment Configuration**: Mirror your Firebase environment variables in the **Vercel Project Settings > Environment Variables** tab.
5. **Continuous Delivery**: Every push or merge to the `main` branch automatically triggers an optimized production deployment with global edge CDN invalidation.

> [!IMPORTANT]
> **Firebase Authorized Domains**:
> Ensure `wordtrack-app.vercel.app` is added to **Firebase Console > Authentication > Settings > Authorized domains** so Google Sign-In and OAuth handshakes operate securely on the live site.

---

## 8. License

Distributed under the **MIT License**. See `LICENSE` for further details.
