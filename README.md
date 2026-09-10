# 🔥 EffStreak (#SoloLeveling Edition)

[![Live App on Surge](https://img.shields.io/badge/Live_App-effstreak--tracker.surge.sh-58CC02?style=for-the-badge&logo=surge&logoColor=white)](https://effstreak-tracker.surge.sh)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=github-actions)](https://github.com/MrAditya-Singh/Streak)
[![Supabase Powered](https://img.shields.io/badge/Cloud-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![SQLite Engine](https://img.shields.io/badge/Local_DB-SQLite_WAL-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![React + Vite](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

> **EffStreak** is an enterprise-grade, gamified personal productivity, habit-tracking, and coding practice platform inspired by **Duolingo streaks** and **Solo Leveling RPG progression**. It unifies coding practice (LeetCode, Codeforces, GFG, AtCoder, GitHub), learning directives, and daily routines into a real-time, cross-device synchronization hub powered by **Supabase Cloud PostgreSQL** and an **Embedded SQLite Local Database Engine**.

---

## 🌐 Live Production Application

- 🚀 **Primary Web App**: **[https://effstreak-tracker.surge.sh](https://effstreak-tracker.surge.sh)**
- ⚡ **Secondary Web App**: **[https://effectivestreak-app.surge.sh](https://effectivestreak-app.surge.sh)**
- 🐙 **GitHub Repository**: **[https://github.com/MrAditya-Singh/Streak](https://github.com/MrAditya-Singh/Streak)**

---

## 🌟 Latest Major Upgrades & New Features

### 🎡 1. Theme Reel Dial & 7 Bespoke Aesthetic Universes
- **Interactive Mechanical Reel Dial**: Click the top header **Moon / Theme icon** to open a vintage **View-Master rotating disc dial** with 7 symmetric apertures (`51.4°` step increments) and mechanical sound effects.
- **7 World-Class Unique Themes**:
  1. ⚡ **Solo Leveling Obsidian** `[HUNTER S-RANK • ⚡ CYBER MANA]`: Deep space obsidian (`#060a12`), Holographic Cyber Grid & Electric Mana Blue Glow (`#38bdf8`).
  2. 🌿 **Emerald Matrix Zen** `[BIO-MATRIX ZEN • 🌿 NEURAL GROVE]`: Deep bamboo velvet (`#02150e`), Matrix Rain drops & Luminous Jade Mint (`#10b981`).
  3. ☀️ **Solar Flare Royale** `[SUPERNOVA 5000K • ☀️ SOLAR CORE]`: Volcanic stellar core (`#15060d`), Molten Amber-Gold (`#f59e0b`) & Corona Radiance.
  4. ❄️ **Arctic Glacier Frost** `[CRYO FROST -40° • ❄️ POLAR AURORA]`: Sub-zero oceanic navy (`#040e1b`), Crystalline Cyan (`#38bdf8`) & Aurora Waves.
  5. 🩸 **Shadow Monarch Crimson** `[SHADOW MONARCH • 🩸 BLOOD ECLIPSE]`: Gothic crypt (`#0d0411`), Vampire Blood Crimson (`#ef4444`) & Royal Purple.
  6. ⚜️ **24K Golden Prestige** `[24K HAUTE PRESTIGE • ⚜️ ROYAL GOLD]`: Brushed titanium noir (`#08080a`), 24K Champagne Gold Foil (`#fbbf24`) & Haute Horlogerie Sheen.
  7. 📜 **Renaissance Parchment** `[FLORENCE 1520 • 📜 ITALIAN VELLUM]`: Florentine vellum paper (`#f4efe6`), Espresso typography & Tuscan Gold (`#b45309`).
- **Live UI Mini-Preview in Cards**: Every theme card displays a live preview of how habit checkmarks, streak fire pills, and progress bars look under that theme.
- **Dual View Modes**: Switch seamlessly between **🎡 Reel Dial View** and **🗂️ Gallery Grid View**.

---

### 📷 2. Interactive Photo Disc Wheel (Daily Mantra & Header Focus)
- **Rotating View-Master Photo Reel**: Integrated above the daily mantra and header photo card with 6 rotating photo apertures.
- **Add / Remove / Switch Focus Images**: Click any lens aperture to rotate and select that photo as your active daily visual anchor.
- **Persistent JPG Storage**: Uploaded images are stored in `.jpg` format in `backend/data/uploads` and synced to the user profile in Supabase & SQLite.

---

### 💾 3. Complete End-to-End Database Sync (SQLite & Supabase)
- **All User Inputs Persisted**:
  - **Habit Ticks**: Stored in `habit_ticks` with `done` status and timestamps.
  - **Custom Habits**: Dynamically creates habit records synced across frontend, local SQLite (`effstreak.db`), and Supabase PostgreSQL.
  - **Thoughts & Notes**: Saved to `thoughts` / `activity_logs` under the user's profile.
  - **Photo Reel & Theme Preferences**: Stored in `user_profiles` and cached locally.
- **Realtime Cross-Device Synchronization**: Instant updates across phone, laptop, and browser tabs.

---

### 🚨 4. Emergency Directive System
- **Quick Time-Boxed Directives**: Create immediate high-priority focus action items with custom durations, audio timers, and XP rewards.

---

## 📱 Installation Guide (Laptop & Mobile)

EffStreak is built as an installable **Progressive Web App (PWA)** for native-app performance on both desktop laptops and mobile devices.

### 💻 A. Install on Laptop (Windows / macOS / Linux)

1. **Via Google Chrome or Microsoft Edge**:
   - Open **[https://effstreak-tracker.surge.sh](https://effstreak-tracker.surge.sh)** in Chrome or Edge.
   - Look at the right side of the address/URL bar and click the **Install App (🖥️ / 📥)** icon.
   - Click **Install**. EffStreak will launch as a standalone desktop window with its own taskbar/dock icon and launch menu shortcut.
2. **Via Desktop Shortcut Script (Windows)**:
   - Run the included PowerShell script:
     ```powershell
     .\create_desktop_shortcut.ps1
     ```
3. **Via Electron Desktop Launcher**:
   - Run `npm run electron:dev` for the native Electron desktop shell.

---

### 📱 B. Install on Mobile (Android & iPhone / iPad)

#### On Android (Google Chrome / Brave / Edge):
1. Open **[https://effstreak-tracker.surge.sh](https://effstreak-tracker.surge.sh)** in Chrome on your phone.
2. Tap the **Three Dots Menu (⋮)** in the top-right corner.
3. Select **"Install app"** or **"Add to Home screen"**.
4. Tap **Install**. The EffStreak icon will appear on your app drawer and home screen. It opens in full-screen standalone mode without browser bars!

#### On iPhone / iPad (Safari):
1. Open **[https://effstreak-tracker.surge.sh](https://effstreak-tracker.surge.sh)** in Safari.
2. Tap the **Share Button (⎋ with arrow up)** at the bottom bar.
3. Scroll down and tap **"Add to Home Screen" (+)**.
4. Tap **Add** in the top right. EffStreak is now installed as an iOS Web App!

---

## 🚀 Deploy on Vercel (Frontend & Backend)

The project includes a ready-to-deploy `vercel.json` and `api/index.js` serverless bridge that hosts both the **React Vite frontend** and the **Express backend API**:

### Option 1: Automatic 1-Click Vercel Git Integration (Recommended)
1. Push your repository to GitHub: `https://github.com/MrAditya-Singh/Streak`.
2. Go to **[https://vercel.com/new](https://vercel.com/new)** and import your `Streak` GitHub repository.
3. In **Environment Variables**, add:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   NODE_ENV=production
   ```
4. Click **Deploy**. Vercel will build both the frontend and configure the `/api/*` serverless backend routes automatically!

### Option 2: Deploy via Vercel CLI
```bash
npx vercel --prod
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
   cd backend && npm install && cd ..
   ```

3. **Start Frontend & Backend Development**:
   ```bash
   # Terminal 1: Frontend Vite App
   npm run dev

   # Terminal 2: Backend Express & SQLite Engine
   cd backend && npm start
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

4. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Data Integrity

- **Row-Level Security (RLS)**: Enforced across all Supabase PostgreSQL tables.
- **Embedded Local SQLite**: High-performance WAL mode on disk (`backend/data/effstreak.db`).
- **Conflict-Free Atomic Upserts**: Safe state reconciliation prevents data loss when switching between mobile, laptop, and cloud.

---

## 📄 License

Distributed under the **MIT License**.

<p align="center">
  <b>Built with ❤️ by Aditya Singh for developers, competitive coders, and lifelong learners.</b>
</p>
