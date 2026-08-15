# 🔥 EffStreak (#SoloLeveling)

> **A cross-device, gamified personal productivity and activity-tracking system inspired by Duolingo streaks and Solo Leveling RPG progression, designed to turn everyday coding practice, learning, projects, and personal goals into measurable daily consistency.**

Designed for **Android (Jetpack Glance)**, **Windows (Rainmeter)**, and **Interactive Web Hub (Vite/React)**.

---

## 🌟 Overview & Philosophy

EffStreak answers the one question that truly matters:

> **"Am I consistently showing up and doing the things that matter to me?"**

Instead of overwhelming spreadsheets and bloated project management apps, EffStreak distills your daily consistency into a compact, glanceable, motivating dashboard and cross-device widgets that you can digest in under five seconds.

```
┌─────────────────────────────────────────────────────────────┐
│ 🔥 97 DAY STREAK                                            │
│ Keep going, Eren! 💪                                        │
│                                                             │
│ 🛡️ Level 18 [████████████████████░░░░] 1,840 / 2,000 XP    │
│                                                             │
│ LC 🔥42   CF 🔥18   GFG 🔥31   GH 🔥26   YT 🔥12   PR 🔥9   │
│                                                             │
│ TODAY'S PLAN                                    5 / 7 DONE  │
│ ✓ LeetCode (1h)          ✓ Codeforces (1h)                  │
│ ✓ GFG (1h)               ✓ GitHub (30m)                     │
│ ✓ Gates Study (2h)       ○ Internship (30m)                 │
│                                                             │
│ 82% EFFICIENCY (↑ 7% from yesterday)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. 🔥 Duolingo-Inspired Streak Engine
- **Overall Streak**: Represents daily consistency without being excessively punishing. Completing at least 1 qualifying activity keeps the flame alive.
- **Per-Platform Streaks**: Individual flame counters for LeetCode (🔥42), Codeforces (🔥18), GFG (🔥31), GitHub (🔥26), YouTube (🔥12), Projects (🔥9), and custom tasks.
- **Sparkline & Best Record**: Visual trend curve highlighting peak records and daily completions (`S M T W T F S`).

### 2. ⚔️ Solo Leveling Hunter Progression System
- **Hunter Ranks**: Progress from **E-Rank** to **D**, **C**, **B**, **A**, **S**, and **National Level / Shadow Monarch**.
- **Attributes**: Real-time attribute calculation for *Discipline*, *Code Mastery*, *Focus Stamina*, and *Daily Grind*.
- **Gamified Sound Effects & Confetti**: Synthesized Web Audio chimes, level-up fanfares, and celebration confetti.

### 3. ⏱️ Planned vs. Actual Efficiency Engine
- Focuses on completed time vs planned time rather than raw task count.
- Dynamic circular efficiency ring (82%) with daily trend comparisons (`↑ 7% from yesterday`).

### 4. 🟩 GitHub-Style Activity Heatmap
- 30-Day and 90-Day interactive commit/activity matrix.
- 5 levels of neon green intensity with hover tooltips displaying date, activities done, and focus minutes.

### 5. 🔄 Live Automated Platform Synchronization
- **GitHub**: Automatically detects public commits, pushes, and pull requests made today.
- **Codeforces**: Queries official Codeforces API for submissions and AC verdicts.
- **LeetCode**: Detects daily solved problems and updates streaks.
- **Manual Overrides**: Seamless toggle support for offline, Gym, Books, Study, and Career goals.

---

## 📱 Cross-Platform Architecture

```
                               ┌───────────────────────────────┐
                               │     EffStreak Sync Engine     │
                               │  (Local Cache / API Services) │
                               └───────────────┬───────────────┘
                                               │
            ┌──────────────────────────────────┼──────────────────────────────────┐
            │                                  │                                  │
    ┌───────▼────────┐                 ┌───────▼────────┐                 ┌───────▼────────┐
    │  Android App   │                 │ Windows Widget │                 │   Web Hub /    │
    │  & Glance UI   │                 │   (Rainmeter)  │                 │ Live Simulator │
    │  Kotlin/Glance │                 │   INI + Lua    │                 │ React+Vite+CSS │
    └────────────────┘                 └────────────────┘                 └────────────────┘
```

---

## 💻 1. Running the Web Hub Locally (Localhost)

```bash
# Clone the repository
git clone https://github.com/your-username/EffectiveStreak.git
cd EffectiveStreak

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🤖 2. Android Studio & Jetpack Glance Setup

The Android project is located in `android/`:

1. Open **Android Studio** and select **Open** -> browse to the `android/` directory.
2. Ensure you have **Android SDK 35** and **JDK 17** installed.
3. Sync Gradle and run the app on an emulator or physical device.
4. Long-press on your Android Home Screen -> **Widgets** -> Add **EffStreak (4x2 / 2x2)** widget.

### Android Highlights:
- `EffStreakWidget.kt`: Modern **Jetpack Glance** widget with responsive layout.
- `StreakSyncWorker.kt`: **WorkManager** periodic background worker ensuring zero battery waste.
- `MainActivity.kt`: Companion Jetpack Compose configuration UI.

---

## 🪟 3. Windows Desktop Widget (Rainmeter)

The Rainmeter skin is located in `windows/Rainmeter/`:

1. Download and install [Rainmeter](https://www.rainmeter.net/).
2. Run `windows/Rainmeter/install_skin.bat` to automatically install the skin to `%USERPROFILE%\Documents\Rainmeter\Skins\EffStreak`.
3. Right-click the Rainmeter system tray icon -> select **Refresh All** -> Load `EffStreak.ini`.

---

## 📂 Project Structure

```
EffectiveStreak/
├── android/                             # Android Studio native package
│   ├── app/
│   │   ├── src/main/java/com/effstreak/app/
│   │   │   ├── data/StreakModels.kt     # Data definitions & offline models
│   │   │   ├── sync/StreakSyncWorker.kt # WorkManager background sync
│   │   │   ├── widget/EffStreakWidget.kt# Jetpack Glance Home Screen Widget
│   │   │   ├── widget/EffStreakReceiver.kt
│   │   │   └── MainActivity.kt          # Compose Companion UI
│   │   └── src/main/AndroidManifest.xml
│   ├── build.gradle.kts
│   └── settings.gradle.kts
│
├── windows/                             # Windows Desktop Widget package
│   └── Rainmeter/
│       ├── install_skin.bat             # 1-click Windows installer
│       └── Skins/EffStreak/
│           ├── EffStreak.ini            # Main Rainmeter desktop skin
│           └── scripts/EffStreak.lua    # Lua data parser
│
├── src/                                 # Interactive Web Hub & Simulator
│   ├── components/                      # UI cards matching reference mockup
│   │   ├── DuoMascot.tsx                # Animated Duolingo owl mascot
│   │   ├── StreakHeaderCard.tsx         # 97 Day Streak + XP progress card
│   │   ├── StreakBannerCurve.tsx        # Sparkline & Best streak curve
│   │   ├── PlatformCardsGrid.tsx        # LC, CF, GFG, GH, YT, Projects cards
│   │   ├── PlatformRings.tsx            # Circular platform progress rings
│   │   ├── CircularPlanIcons.tsx        # Today's plan icon strip
│   │   ├── TodayPlanCard.tsx            # Interactive task checklist & quote
│   │   ├── TodayActivityTimeline.tsx    # Activity timeline with timestamps
│   │   ├── EfficiencyGauge.tsx          # 82% circular SVG gauge
│   │   ├── ActivityHeatmap.tsx          # GitHub-style activity matrix
│   │   ├── QuickStatsBar.tsx            # Focus time, tasks done, XP, streak
│   │   ├── MiniWidgetCards.tsx          # Compact badges & mountain banner
│   │   ├── WidgetSimulatorModal.tsx     # Live cross-platform widget simulator
│   │   ├── LiveSyncModal.tsx            # GitHub, Codeforces, LeetCode live sync
│   │   ├── SoloLevelingModal.tsx        # RPG Hunter rank & stats modal
│   │   └── SettingsModal.tsx            # Custom tasks, timezone, export/import
│   ├── services/apiSync.ts              # Live external API integration
│   ├── utils/audio.ts                   # Web Audio API sound FX synthesizer
│   ├── utils/streakEngine.ts            # Streak, summary, and heatmap engine
│   ├── types/index.ts
│   ├── App.tsx
│   └── index.css                        # Glassmorphism design system
│
├── package.json
└── README.md
```

---

## 🔒 Security & Privacy

- External platform usernames are stored locally on device and never exposed to unauthenticated third parties.
- Server-side API tokens (where required) should be kept in environment variables (`.env`).

---

## 🏆 Definition of Done Checklist

- [x] Pixel-perfect visual fidelity to design mockup (Dark mode, Duolingo mascot, glowing cards).
- [x] Streak Engine with overall and per-platform streaks.
- [x] Efficiency system (planned vs completed minutes).
- [x] Solo Leveling RPG ranking & leveling system with audio and confetti.
- [x] GitHub & Codeforces live API synchronization.
- [x] GitHub-style activity heatmap with 5 green intensity levels.
- [x] Android Jetpack Glance widget package (`android/`).
- [x] Windows Rainmeter desktop widget package (`windows/`).
- [x] Interactive Widget Simulator for 2x2, 4x2, and 4x4 Android/Windows widgets.
- [x] Production build passes with 0 errors (`npm run build`).

---

## 📄 License

MIT License © 2026 EffStreak Team.
