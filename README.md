# 🔥 EffStreak (#SoloLeveling Edition)

[![Live App on Surge](https://img.shields.io/badge/Live_App-effstreak--tracker.surge.sh-58CC02?style=for-the-badge&logo=surge&logoColor=white)](https://effstreak-tracker.surge.sh)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=github-actions)](https://github.com/MrAditya-Singh/Streak)
[![Firebase Powered](https://img.shields.io/badge/Cloud-Firebase_UID-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React + Vite](https://img.shields.io/badge/Frontend-React_18_+_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

> **EffStreak** is an enterprise-grade, gamified personal productivity and activity-tracking platform inspired by **Duolingo streaks** and **Solo Leveling RPG progression**. It aggregates coding practice (LeetCode, Codeforces, GFG, AtCoder, GitHub), learning, and daily habits into a real-time, cross-device cloud synchronization hub with central source-of-truth reliability.

---

## 🌐 Live Production Application

- 🚀 **Primary Web App**: **[https://effstreak-tracker.surge.sh](https://effstreak-tracker.surge.sh)**
- ⚡ **Secondary Web App**: **[https://effectivestreak-app.surge.sh](https://effectivestreak-app.surge.sh)**
- 🐙 **GitHub Repository**: **[https://github.com/MrAditya-Singh/Streak](https://github.com/MrAditya-Singh/Streak)**

---

## 🌟 Core Architecture & Principles

EffStreak is built ground-up around 7 non-negotiable architectural principles:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EFFSTREAK CLOUD ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│    ┌─────────────────┐       ┌─────────────────┐       ┌──────────────┐ │
│    │ Multiple Users  │       │ Multi-Device    │       │ Firebase     │ │
│    │ (Infinite UIDs) │ ────► │ Real-Time Sync  │ ────► │ Cloud        │ │
│    └─────────────────┘       └─────────────────┘       │ Firestore    │ │
│                                                        └──────┬───────┘ │
│    ┌─────────────────┐       ┌─────────────────┐              │         │
│    │ Production      │       │ Strict Data     │ ◄────────────┘         │
│    │ Security Rules  │ ────► │ Isolation (UID) │                        │
│    └─────────────────┘       └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

1. **Central Cloud Database as Primary Source of Truth**: `users/{uid}/data/state` on Firebase Firestore stores all user attributes, habits, streaks, and monthly matrix states. Local storage acts purely as a secondary offline buffer.
2. **Strict User Data Isolation**: Cloud security rules strictly enforce `request.auth != null && request.auth.uid == uid`, guaranteeing total data privacy across independent users.
3. **No Accidental Data Overwrites**: Atomic `setDoc(..., { merge: true })` updates preserve user state even under simultaneous multi-device sync.
4. **Real-time Live Synchronization**: Instant cross-device state propagation via Firestore snapshot listeners and client-side `BroadcastChannel`.
5. **Multi-Platform Live API Integration**: Fast, direct integration with **LeetCode**, **Codeforces**, **GitHub**, **GeeksforGeeks**, **AtCoder**, **HackerRank**, and **YouTube** via Codolio & public APIs.

---

## 🚀 Key Features

### 1. 🔥 Duolingo-Inspired Streak Engine
- **Unified Overall Streak**: Tracks daily consistency across all learning and practice tracks. Completing any qualifying activity maintains the global flame.
- **Per-Platform Flame Counters**: Dedicated streaks for **LeetCode**, **Codeforces**, **GeeksforGeeks**, **GitHub**, **AtCoder**, and **YouTube**.
- **Interactive Monthly Matrix Grid**: 31-day visual habit completion matrix with automatic date fill from live platform submission calendars.

### 2. ⚔️ Solo Leveling Hunter Progression System
- **Hunter Ranks**: Advance from **E-Rank** to **D-Rank**, **C-Rank**, **B-Rank**, **A-Rank**, **S-Rank**, and **Shadow Monarch / National Level Hunter**.
- **Dynamic RPG Attributes**: Real-time attribute accumulation for *Strength*, *Intelligence*, *Discipline*, *Skill*, *Knowledge*, and *Professionalism*.
- **Web Audio FX & Confetti**: Immersive audio chimes on task completion and level-up fanfares with particle celebrations.

### 3. 🔄 Multi-Platform Live Sync Engine
- **LeetCode**: Full 365-day submission calendar integration, total problems solved by difficulty (Easy/Medium/Hard), and daily POTD detection.
- **Codeforces**: Real-time user status API integration for contest ratings and submission verdicts.
- **GitHub**: Complete annual contribution map (`developmentActivity`) with public repo counts and commit verification.
- **GeeksforGeeks**: Verified practice history, total solved count, and streak detection.
- **AtCoder & HackerRank**: Live submission checks and contest activity sync.

### 4. 🟩 GitHub-Style Activity Heatmap & Analytics
- 30-day and 90-day interactive activity heatmaps with 5 levels of neon green intensity.
- Focus time statistics, efficiency percentage calculation (planned vs completed minutes), and trend curves.

---

## 📂 Repository Structure

```
EffectiveStreak/
├── firestore.rules                      # Production Firestore Security Rules (UID isolated)
├── public/                              # Static public assets & SPA routing fallback
│   ├── 200.html                         # Surge CDN SPA fallback page
│   └── favicon.svg
├── src/                                 # Frontend Web Hub (React + Vite + TypeScript)
│   ├── components/                      # UI Components & Modals
│   │   ├── AuthModal.tsx                # Firebase Authentication Modal (Google & Email)
│   │   ├── LiveSyncModal.tsx            # Multi-Platform Parallel Live Sync Modal
│   │   ├── MasterMonthlyHabitGrid.tsx   # 31-Day Monthly Habit Checkbox Matrix
│   │   ├── LivePerformanceDeck.tsx      # Solo Leveling RPG Deck & Efficiency Gauges
│   │   ├── PlatformCardsGrid.tsx        # Platform Flame Cards with Weekly Themes
│   │   ├── AestheticHeaderTracker.tsx   # Header Progress Bar & Hunter Rank Banner
│   │   └── ...
│   ├── services/                        # Cloud & API Services
│   │   ├── firebase.ts                  # Firebase Initializer & Firestore CRUD Operations
│   │   ├── firebaseAuth.ts              # Firebase Auth Helpers & Bearer Token Provider
│   │   ├── cloudSync.ts                 # Realtime Firestore Listener & Sync Engine
│   │   └── apiSync.ts                   # Multi-Platform Fast API Integration Engine
│   ├── utils/                           # Engine Utilities
│   │   ├── streakEngine.ts              # Streak Math, Levels, and Default State
│   │   └── audio.ts                     # Web Audio API Sound Synthesizer
│   ├── types/                           # TypeScript Interface & Type Definitions
│   ├── App.tsx                          # Core Application Lifecycle & Auth Bindings
│   ├── main.tsx                         # ErrorBoundary & React Root Entry
│   └── index.css                        # Glassmorphism Design System & Cyber Aesthetics
├── backend/                             # Express.js Proxy Backend (Render Free Tier Ready)
│   ├── src/
│   │   ├── config/firebase.js           # Firebase Admin SDK Initializer
│   │   ├── routes/sync.routes.js        # Auth-Verified Cloud Sync Endpoints
│   │   └── routes/integrations.routes.js# Auth-Verified Platform Proxy Routes
│   ├── package.json
│   └── server.js
├── android/                             # Android Companion App & Jetpack Glance Widgets
├── windows/                             # Windows Rainmeter Desktop Skin & Lua Scripts
├── package.json                         # Vite Build Configuration & NPM Dependencies
├── tsconfig.json
├── vite.config.ts
└── README.md                            # Comprehensive Developer Documentation
```

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js** >= 18.x
- **NPM** >= 9.x

### Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/MrAditya-Singh/Streak.git
   cd Streak
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build Production Dist Bundle**:
   ```bash
   npm run build
   ```

5. **Deploy to Surge CDN**:
   ```bash
   npx -y surge dist --domain effstreak-tracker.surge.sh
   ```

---

## 🔒 Security & Data Isolation

- **Firebase Security Rules**: All user document reads/writes require verified Firebase ID tokens and are restricted to `/users/{uid}/*`.
- **Zero Accidental Wipes**: Local state parsing includes `try / catch` fallback shields, preventing broken cache states from corrupting user profiles.
- **Client Shield**: Network or API failures fallback gracefully to direct aggregator APIs without clearing existing habit completion history.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <b>Built with ❤️ by Aditya Singh for developers, competitive coders, and lifelong learners.</b>
</p>
