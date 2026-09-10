# 🔥 EffStreak (#SoloLeveling Edition)

[![Live App on Surge](https://img.shields.io/badge/Live_App-effstreak--tracker.surge.sh-58CC02?style=for-the-badge&logo=surge&logoColor=white)](https://effstreak-tracker.surge.sh)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=github-actions)](https://github.com/MrAditya-Singh/Streak)
[![Supabase Powered](https://img.shields.io/badge/Cloud-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![SQLite Engine](https://img.shields.io/badge/Local_DB-SQLite_WAL-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![React + Vite](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

> **EffStreak** is an enterprise-grade, gamified personal productivity and activity-tracking platform inspired by **Duolingo streaks** and **Solo Leveling RPG progression**. It aggregates coding practice (LeetCode, Codeforces, GFG, AtCoder, GitHub), learning, and daily habits into a real-time, cross-device synchronization hub powered by **Supabase Cloud PostgreSQL** and an **Embedded SQLite Local Database Engine**.

---

## 🌐 Live Production Application

- 🚀 **Primary Web App**: **[https://effstreak-tracker.surge.sh](https://effstreak-tracker.surge.sh)**
- ⚡ **Secondary Web App**: **[https://effectivestreak-app.surge.sh](https://effectivestreak-app.surge.sh)**
- 🐙 **GitHub Repository**: **[https://github.com/MrAditya-Singh/Streak](https://github.com/MrAditya-Singh/Streak)**

---

## 🌟 Core Architecture & Principles

EffStreak utilizes a resilient dual-database architecture ensuring instant offline performance and real-time multi-device cloud synchronization:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              EFFSTREAK SUPABASE & SQLITE ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│    ┌─────────────────┐       ┌─────────────────┐       ┌──────────────┐ │
│    │ Multiple Users  │       │ Multi-Device    │       │ Supabase     │ │
│    │ (UID / Google)  │ ────► │ Realtime Sync   │ ────► │ Cloud        │ │
│    └─────────────────┘       └─────────────────┘       │ PostgreSQL   │ │
│                                                        └──────┬───────┘ │
│    ┌─────────────────┐       ┌─────────────────┐              │         │
│    │ Embedded SQLite │       │ Local Offline   │ ◄────────────┘         │
│    │ (effstreak.db)  │ ────► │ Persistence     │                        │
│    └─────────────────┘       └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

1. **Embedded SQLite Local Database (`backend/data/effstreak.db`)**: High-performance, zero-latency relational storage running on disk in WAL mode. Guarantees 100% offline availability with transactional reliability for all habits, matrix states, and activity logs.
2. **Supabase Cloud Database & Authentication**: Cloud PostgreSQL tables (`user_profiles`, `user_state`, `activity_logs`, `custom_platforms`) with Row-Level Security (RLS) policies, Realtime publication channels, and Google OAuth / Email authentication.
3. **No Accidental Data Overwrites**: Atomic upserts and conflict resolution preserve user state during simultaneous multi-device sync.
4. **Real-time Cross-Device Synchronization**: Instant state propagation via Supabase Realtime Channels and client-side `BroadcastChannel`.
5. **Multi-Platform Live API Integration**: Fast, direct sync with **LeetCode**, **Codeforces**, **GitHub**, **GeeksforGeeks**, **AtCoder**, **HackerRank**, and **YouTube** via Codolio & platform APIs.

---

## 🚀 Key Features

### 1. 🔥 Duolingo-Inspired Streak Engine
- **Unified Overall Streak**: Tracks daily consistency across all learning and practice tracks. Completing any qualifying activity maintains the global flame.
- **Per-Platform Flame Counters**: Dedicated streaks for **LeetCode**, **Codeforces**, **GeeksforGeeks**, **GitHub**, **AtCoder**, and **YouTube**.
- **Interactive Monthly Matrix Grid**: 31-day visual habit completion matrix with automatic date fill from live platform submission calendars.

### 2. ⚔️ Solo Leveling Hunter Progression System
- **Hunter Ranks**: Advance from **E-Rank** to **D-Rank**, **C-Rank**, **B-Rank**, **A-Rank**, **S-Rank**, and **National Level Hunter**.
- **Dynamic RPG Attributes**: Real-time attribute accumulation for *Strength*, *Intelligence*, *Discipline*, *Skill*, *Knowledge*, and *Professionalism*.
- **Web Audio FX & Confetti**: Immersive audio chimes on task completion and level-up fanfares with particle celebrations.

### 3. 🔄 Multi-Platform Live Sync Engine
- **LeetCode**: Full 365-day submission calendar integration, total problems solved by difficulty (Easy/Medium/Hard), and daily POTD detection.
- **Codeforces**: Real-time user status API integration for contest ratings and submission verdicts.
- **GitHub**: Complete annual contribution map (`developmentActivity`) with public repo counts and commit verification.
- **GeeksforGeeks**: Verified practice history, total solved count, and streak detection.
- **AtCoder & HackerRank**: Live submission checks and contest activity sync.

### 4. 🟩 Activity Heatmap & Consistency Analytics
- Interactive consistency overviews, completion metrics, and streak status across custom and predefined habits.
- Focus time statistics, efficiency percentage calculation (planned vs completed minutes), and trend curves.

---

## 📂 Repository Structure

```
Streak/
├── .github/                            # CI/CD GitHub Actions Workflows
├── dist/                               # Production Web Build
├── electron/                           # Desktop Electron Shell
│   └── main.cjs
├── public/                             # Public static assets & web manifest
├── src/                                # Frontend Application (React 19 + TypeScript + Vite)
│   ├── components/                     # Modular UI Components & Modals
│   │   ├── AddHabitModal.tsx           # Add Custom Habit & Platform Modal
│   │   ├── AestheticHeaderTracker.tsx  # Header Progress Bar & Hunter Rank Banner
│   │   ├── AuthModal.tsx               # Supabase Authentication Modal (Google & Email)
│   │   ├── EfficiencyAnalyticsModal.tsx# Analytics & Completion Gauges
│   │   ├── LivePerformanceDeck.tsx     # Solo Leveling RPG Deck & Quick Stats
│   │   ├── LiveSyncModal.tsx           # Multi-Platform Parallel Live Sync Modal
│   │   ├── MasterMonthlyHabitGrid.tsx  # 31-Day Monthly Habit Checkbox Matrix
│   │   ├── SettingsModal.tsx           # Profile, Integrations & Platform Settings
│   │   ├── SoloLevelingModal.tsx       # RPG Stats, Quests & Hunter Rank Modal
│   │   ├── SyncSetupCard.tsx           # Cross-Device Sync Identity Setup Card
│   │   ├── TodayActivityModal.tsx      # Today's Action Items & Directives
│   │   ├── WeeklyConsistencyOverview.tsx # Weekly Habit Consistency Cards
│   │   └── WidgetSimulatorModal.tsx    # Desktop & Phone Widget Simulator
│   ├── services/                       # Data & Cloud Services
│   │   ├── apiSync.ts                  # Multi-Platform Fast API Integration Engine
│   │   ├── authService.ts              # Authentication & Guest Mode Helper
│   │   ├── cloudSync.ts                # Real-Time Cloud & Cross-Tab Sync Engine
│   │   ├── exportService.ts            # JSON & CSV Data Export Utilities
│   │   ├── supabase.ts                 # Supabase Web Client & Cloud Database Sync
│   │   └── supabaseAuth.ts             # Supabase Auth Provider & Session Tokens
│   ├── types/                          # TypeScript Interfaces & Types
│   ├── utils/                          # Engine Utilities & Synthesizer
│   │   ├── audio.ts                    # Web Audio API Sound FX
│   │   └── streakEngine.ts             # Streak Calculations & Progression Logic
│   ├── App.tsx                         # Core Application Lifecycle & State Management
│   ├── index.css                       # Tailwind CSS & Cyber Glassmorphism Design
│   └── main.tsx                        # Error Boundary & React Root Entry
├── backend/                            # Node.js / Express Backend Engine
│   ├── data/                           # effstreak.db (SQLite Database in WAL Mode)
│   ├── src/
│   │   ├── config/                     # Database Configurations (sqlite.js, supabase.js)
│   │   ├── integrations/               # Platform Adapters (GitHub, LeetCode, Codeforces, etc.)
│   │   ├── middleware/                 # Supabase Auth JWT Middleware
│   │   ├── routes/                     # REST API Routes (auth, health, integrations, sync)
│   │   ├── services/                   # Backend Streak Engine & Cron Auto-Sync
│   │   ├── utils/                      # Encryption & Helper Utilities
│   │   ├── app.js                      # Express App Configuration & CORS
│   │   └── server.js                   # Backend Server Entrypoint
│   └── package.json
├── windows/                            # Rainmeter Desktop Widgets & Sync Bridge
├── android/ & android_wrapper/         # Android Companion App & Native Project
├── supabase_schema.sql                 # Supabase Database Migration & RLS Script
├── package.json                        # Frontend NPM Dependencies & Scripts
├── tailwind.config.js                  # Tailwind Configuration
└── tsconfig.json                       # TypeScript Configuration
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

2. **Install Frontend & Backend Dependencies**:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Configure Environment Variables (Optional)**:
   Copy `.env.example` to `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Start Backend Server & Embedded SQLite Engine**:
   ```bash
   cd backend
   npm start
   ```
   The backend API will run on `http://localhost:5000` with the SQLite database active at `backend/data/effstreak.db`.

6. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Data Isolation

- **Row-Level Security (RLS)**: Cloud database access is protected via Supabase security policies.
- **Embedded Local SQLite Database**: Data is stored securely on your local disk with WAL journaling.
- **Zero Accidental Wipes**: Client-side state hydration includes safe `try / catch` fallback shields, preventing broken cache states from corrupting user profiles.
- **Client Shield**: Network failures fallback gracefully to local offline storage without clearing habit completion history.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <b>Built with ❤️ by Aditya Singh for developers, competitive coders, and lifelong learners.</b>
</p>
