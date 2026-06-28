# ⚔️ Shadow Rift — Webcam Fighter

> A browser-based fighting game controlled entirely by your body using AI pose detection.

[![Deploy to GitHub Pages](https://github.com/YOUR_USERNAME/shadow-rift/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/shadow-rift/actions/workflows/deploy.yml)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-orange)](https://mediapipe.dev)

---

## 🎮 Gameplay

Shadow Rift is a 1v1 fighting game where **you control your character using your webcam**. MediaPipe Pose tracks your body in real time — raise a fist to punch, lift a knee to kick, raise both arms to block.

Your opponent **Shadow** is an AI fighter with a full state machine — it advances, retreats, attacks, and blocks based on your position and health.

### Controls

| Body Movement | Action |
|---|---|
| Raise one wrist above shoulder | **Punch** |
| Raise both wrists above shoulders | **Block** |
| Raise one knee above hip | **Kick** |
| Crouch / duck body down | **Dodge** |
| Raise both arms above head (power full) | **SUPER MOVE** |
| Shift body left / right | **Move** |

**No webcam?** On-screen buttons and keyboard work too:

| Key | Action |
|---|---|
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `Z` | Punch |
| `S` | Kick |
| `X` | Block (hold) |
| `Space` | Super (when power bar full) |

### Game Rules
- Best of **3 rounds** — first to win 2 rounds wins the match
- Each round has a **60-second timer**
- If time runs out, highest HP wins
- Land hits to fill your **power bar** (5 pips) — then trigger Super!
- Blocking reduces incoming damage by **90%**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite 5 |
| Pose Detection | MediaPipe Pose (WASM) |
| Rendering | HTML5 Canvas (2D) |
| Animation | requestAnimationFrame loop @ 60fps |
| Deployment | GitHub Pages via GitHub Actions |

---

## 📁 Project Structure

```
shadow-rift/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-deploy to GitHub Pages on push to main
├── src/
│   ├── App.jsx                 # Root component — orchestrates all screens & hooks
│   ├── main.jsx                # React entry point
│   │
│   ├── components/
│   │   ├── TitleScreen.jsx     # Start screen with logo animation
│   │   ├── GameOverScreen.jsx  # Victory / defeat / draw screen
│   │   ├── CalibrationOverlay.jsx  # 3-second countdown before pose starts
│   │   ├── HUD.jsx             # Health bars, power pips, round timer
│   │   ├── BottomHUD.jsx       # Pose status + PiP camera preview
│   │   ├── ActionBanner.jsx    # Animated "FIGHT!" / "KO!" centre banners
│   │   ├── ControlButtons.jsx  # On-screen touch/click buttons
│   │   └── DamageNumbers.jsx   # Floating damage number pop-ups
│   │
│   ├── game/
│   │   ├── engine.js           # ParticleSystem, ShockwaveSystem, ArenaBackground
│   │   ├── Fighter.js          # Base fighter class (state machine, physics, hit detection)
│   │   ├── Kai.js              # Player character — blue neon anime fighter
│   │   └── Shadow.js           # AI character — dark villain with aura + AI brain
│   │
│   ├── hooks/
│   │   ├── useGameLoop.js      # Main rAF game loop, fighter ticking, canvas drawing
│   │   └── usePoseDetection.js # MediaPipe Pose init, landmark smoothing, gesture detection
│   │
│   └── styles/
│       ├── global.css          # Reset, CSS variables, HUD, canvas, overlay styles
│       └── screens.css         # Title, Game Over screen styles
│
├── index.html                  # Vite entry HTML — loads MediaPipe from CDN
├── vite.config.js              # Vite config with base: './' for GitHub Pages
├── package.json
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- npm 9+
- A modern browser (Chrome or Edge recommended for best webcam + WASM support)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/shadow-rift.git
cd shadow-rift

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

> **Important:** The webcam prompt requires a secure context. `localhost` works fine. If running on a local network, you may need HTTPS.

---

## 🌐 Deploying to GitHub Pages

### Automatic (recommended)

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set Source to **GitHub Actions**
4. Push any commit to `main` — the workflow builds and deploys automatically
5. Your game is live at `https://YOUR_USERNAME.github.io/shadow-rift/`

### Manual

```bash
npm run build
# Then upload the /dist folder contents to your hosting of choice
```

---

## 🎨 Characters

### KAI (You)
- Blue neon armour with a glowing cyan chest gem
- Spiky anime hair with red headband
- Cyan fist glow during attacks
- Blue eyes that glow on detection

### SHADOW (AI)
- Dark villain in a purple-black cloak
- Glowing red eyes and facial scar
- Purple energy aura that pulses
- Red fist glow on attacks

---

## 🏗️ Architecture Notes

### Game Loop
The game runs a fixed `requestAnimationFrame` loop in `useGameLoop.js` at ~60fps. It:
1. Ticks the AI state machine
2. Ticks both fighters (physics, state timers, facing)
3. Runs hit detection with one-hit-per-swing guard (`hitLanded` flag)
4. Draws background → fighters → shockwaves → particles → combo text

### Pose Detection
`usePoseDetection.js` runs a **separate rAF loop at ~20fps** feeding frames to MediaPipe Pose. Landmark values are smoothed with exponential moving average (α=0.3) before gesture thresholds are checked. The skeleton is drawn as an overlay on the PiP camera box.

### Damage System
- Normal punch: **12 dmg** (player) / **9 dmg** (AI)
- Special: **24 dmg** (player) / **20 dmg** (AI)
- Block reduces damage by **90%**
- `invTimer` (0.5s) prevents double-hits
- `hitLanded` flag ensures only one damage event per attack animation

---

## 📄 License

MIT — free to use, modify and distribute.

---

## 🙏 Credits

- [MediaPipe](https://mediapipe.dev) — real-time pose landmark detection
- [Vite](https://vitejs.dev) — lightning-fast build tool
- [React](https://react.dev) — UI framework
- Inspired by classic 2D fighters like Street Fighter and Mortal Kombat
