# WordTrack

> **The centralized daily word game tracker, discovery hub, and performance journal.**

[![Live Web App](https://img.shields.io/badge/Live_App-wordtrack--app.vercel.app-059669?style=for-the-badge&logo=vercel&logoColor=white)](https://wordtrack-app.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-334155?style=for-the-badge)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase 12](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)

**WordTrack** is a centralized home for online word puzzle enthusiasts. Whether your morning routine includes Wordle, Connections, Quordle, Octordle, Contexto, or Weaver, WordTrack organizes your daily play list in one unified dashboard, tracks your multi-game streaks, and logs your historical scores in a permanent cloud journal.

👉 **Play and track your daily puzzles:** [https://wordtrack-app.vercel.app](https://wordtrack-app.vercel.app)

---

## 🎯 The Problem WordTrack Solves

Daily word puzzle players typically solve 3 to 6 different games every morning. However, the experience is heavily fragmented:

* **Scattered Routines:** Progress and streaks live across disconnected browser tabs and device cookies that vanish whenever browser history or cache is cleared.
* **Incompatible Scoring Systems:** Generic habit or score trackers assume simple binary win/loss or standard guess counters, completely failing for multi-board clears, unlimited step deduction ladders, semantic search puzzles, or timed word hunts.
* **No Centralized Performance Diary:** Players lack a unified view to analyze their overall solve rates, review historic puzzles, or inspect monthly engagement trends across different game styles.

**WordTrack resolves this by providing a polymorphic command center and lifetime journal for daily word puzzles.**

---

## ✨ Core Features

### 🗓️ Daily Hub & Routine Manager
* **Live Routine Progress:** Dynamic progress bar showing daily completion percentages with active Remaining vs. Completed game splits.
* **1-Click Launch & Log:** Open official puzzle sites in a click, then return to record scores in seconds.
* **Continuous Streak Engine:** Intelligently checks yesterday-to-today continuity, ensuring you never lose your streak if you complete puzzles later in the evening.
* **Zero-Clutter Default Slate:** New accounts and unlogged visitors start with a clean dashboard—star only the specific games you actively play.

### 🧠 Polymorphic Category Engine
Different word puzzles use fundamentally distinct rules. WordTrack natively normalizes and supports 6 gameplay archetypes:

| Category Archetype | Representative Games | Metrics Tracked |
| :--- | :--- | :--- |
| **Classic Single-Board** | Wordle, Word500, Waffle, Poople | Solved / Failed, attempts used out of max tries (e.g., `4/6`) |
| **Multi-Board Grid** | Quordle, Octordle, Sedecordle | Boards cleared (e.g., `8/8`) and attempts consumed (`11/13`) |
| **Unlimited Steps / Ladder** | Contexto, Semantle, Weaver | Free-text efficiency metrics (`34 Guesses`, `6 Steps`, `12 Swaps`) |
| **Grouping & Deduction** | Connections, Swapple | Exact groups cleared (`0–4`) alongside mistakes made (`0–4`) |
| **High Score / Timed** | SpellTower, Squaredle, Blossom | High scores achieved with customizable metric units (`Points`, `Words`) |
| **Casual / Practice** | Absurdle, Squabble, Wordle Cup | Direct 1-click launch for unranked practice and real-time multiplayer |

### 📖 Performance Diary & Calendar Heatmap
* **Monthly Activity Heatmap:** GitHub-style interactive calendar with color-coded density dots reflecting daily puzzle engagement.
* **Smart Clipboard Share Parser:** Paste raw share blocks (e.g., `Wordle 1,142 4/6*` or `Connections Puzzle #420`) directly into notes to auto-detect attempts and outcomes.
* **Per-Game Historical Analytics:** Detailed lifetime breakdown covering win rates, total games completed, and average attempts per puzzle.
* **Batch Journal Management:** Filter past dates, revisit earlier puzzle solutions, edit entries, or batch-delete records with confirmation safeguards.

### 🤝 Community-Driven Catalog
* **Suggest New Puzzles:** Built-in 4-step submission wizard allowing players to submit new daily or casual word games.
* **Moderation Pipeline:** Track submitted games with real-time status badges (`Pending`, `Approved`, `Rejected`) and transparent reviewer feedback.

---

## 🔒 Security & Data Privacy

* **Strict Account Isolation:** Favoriting and score journaling require authentication to prevent shared-device data contamination.
* **Zero Cross-Session Leakage:** Signing out completely wipes cached session identifiers from browser storage, ensuring secondary users never inherit previous favorites.
* **Granular Role-Based Access Control (RBAC):** Cloud Firestore rules enforce strict user data ownership—players can only view and modify their own score entries and profiles.
* **Verified Administrator Guards:** Catalog modifications and submission reviews require verified administrator credentials verified through Firebase Auth tokens.

---

## 🏗️ Architecture & Technology

WordTrack is engineered as a responsive single-page web application optimized for mobile and desktop screens alike:

* **Frontend:** React 19, TypeScript 5.8, Vite 6
* **Styling & UI:** Tailwind CSS v4, Lucide Icons, Framer Motion (`motion/react`), Canvas-Confetti
* **Cloud Infrastructure:** Google Cloud Firestore (real-time listeners & compound indexing), Firebase Authentication
* **Hosting & Delivery:** Vercel Global Edge Network with continuous integration and automated branch previews

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
