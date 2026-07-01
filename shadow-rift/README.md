# ⚔️ Shadow Rift — Webcam Fighter

> A full-stack browser fighting game controlled by your body using AI pose detection, with MongoDB-powered leaderboards, player profiles, match history and achievements.

[![Deploy](https://github.com/YOUR_USERNAME/shadow-rift/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/shadow-rift/actions)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com/atlas)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com)

---

## 🎮 Gameplay

Shadow Rift is a 1v1 fighting game where you control your character using your **webcam**. MediaPipe Pose tracks your body in real time. Your match results are saved to MongoDB Atlas with full stats and achievements.

### Controls

| Body Move | Action |
|---|---|
| Raise one wrist above shoulder | **Punch** |
| Both wrists above shoulders | **Block** |
| Raise knee above hip | **Kick** |
| Crouch down | **Dodge** |
| Both arms above head (power full) | **SUPER MOVE** |
| Shift body left/right | **Move** |

Keyboard fallback: `A/D` move · `Z` punch · `S` kick · `X` block · `Space` super

---

## 🗄️ Database Features (MongoDB)

| Feature | Description |
|---|---|
| **Player Profiles** | Username, lifetime stats, rank tier |
| **Leaderboard** | Global top 20 ranked by ELO points |
| **Match History** | Every match saved with round breakdown |
| **Achievements** | 12 unlockable achievements |
| **Rank System** | Bronze → Silver → Gold → Platinum → Diamond |
| **Live Stats** | Damage dealt/taken, best combo, win streak |

### Achievements
🩸 First Blood · ⚡ Combo Starter · 👑 Combo King · 🛡️ Untouchable · 💥 Super Fighter  
🎖️ War Veteran · 🔥 On Fire · 🌪️ Unstoppable · 🥊 KO Artist · 💎 Diamond Rank  
⚔️ Centurion · 💪 Iron Will

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | MongoDB Atlas + Mongoose |
| Pose AI | MediaPipe Pose (WASM) |
| Rendering | HTML5 Canvas 2D @ 60fps |
| Deployment | GitHub Pages (frontend) + Render (backend) |

---

## 📁 Project Structure

```
shadow-rift/
├── server/                         ← Express + MongoDB backend
│   ├── index.js                    ← Server entry, MongoDB connect
│   ├── package.json
│   ├── .env.example                ← Copy to .env and fill in
│   ├── models/
│   │   ├── Player.js               ← Player schema (stats, rank, achievements)
│   │   └── Match.js                ← Match schema (rounds, stats, points)
│   ├── routes/
│   │   ├── players.js              ← GET/POST player endpoints
│   │   └── matches.js              ← POST match save, GET leaderboard
│   └── middleware/
│       └── achievements.js         ← Achievement definitions + unlock logic
│
├── src/                            ← React frontend
│   ├── App.jsx                     ← Main orchestrator (all phase logic)
│   ├── main.jsx
│   ├── context/
│   │   └── PlayerContext.jsx       ← Global player state
│   ├── services/
│   │   └── api.js                  ← All fetch calls to backend
│   ├── components/
│   │   ├── LoginScreen.jsx         ← Username entry
│   │   ├── TitleScreen.jsx
│   │   ├── Leaderboard.jsx         ← Global top 20
│   │   ├── PlayerProfile.jsx       ← Stats + achievements + history
│   │   ├── MatchResultScreen.jsx   ← Post-match points + new achievements
│   │   ├── HUD.jsx
│   │   ├── BottomHUD.jsx
│   │   ├── ActionBanner.jsx
│   │   ├── ControlButtons.jsx
│   │   ├── DamageNumbers.jsx
│   │   └── CalibrationOverlay.jsx
│   ├── game/
│   │   ├── engine.js               ← Particles, shockwaves, arena
│   │   ├── Fighter.js              ← Base class
│   │   ├── Kai.js                  ← Player character
│   │   └── Shadow.js               ← AI character
│   ├── hooks/
│   │   ├── useGameLoop.js          ← 60fps canvas game loop
│   │   └── usePoseDetection.js     ← MediaPipe pose detection
│   └── styles/
│       ├── global.css
│       ├── screens.css
│       └── db-screens.css          ← Leaderboard, profile, result styles
│
├── .github/workflows/deploy.yml   ← Auto GitHub Pages deploy
├── .env.example                   ← Frontend env template
├── index.html
├── vite.config.js
└── package.json
```

---

## 🚀 Running Locally

### 1. Frontend

```bash
# In project root
npm install
cp .env.example .env.local
# Edit .env.local: VITE_API_URL=http://localhost:5000
npm run dev
# → http://localhost:5173
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and settings
npm run dev
# → http://localhost:5000
```

### 3. MongoDB Atlas (free)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free account
2. Create a free **M0** cluster
3. Click **Connect → Drivers** → copy the connection string
4. Paste into `server/.env` as `MONGODB_URI`
5. Whitelist your IP in **Network Access** (or use `0.0.0.0/0` for dev)

---

## 🌐 Deploying to Production

### Frontend → GitHub Pages

1. Push to GitHub
2. Settings → Pages → Source: **GitHub Actions**
3. Add `VITE_API_URL=https://your-api.onrender.com` as a repo **secret** called `VITE_API_URL`
4. Update the deploy workflow to pass it as a build arg (see workflow file)

### Backend → Render (free)

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables: `MONGODB_URI`, `PORT=5000`, `CLIENT_ORIGIN=https://YOUR_USERNAME.github.io`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/players/register` | Create or fetch player by username |
| `GET`  | `/api/players/:username` | Get player profile |
| `GET`  | `/api/players/:username/history` | Match history (last 20) |
| `GET`  | `/api/players/leaderboard/top` | Top 20 global leaderboard |
| `POST` | `/api/matches` | Save match + update stats + check achievements |
| `GET`  | `/api/matches/recent` | Recent matches (global feed) |
| `GET`  | `/api/matches/stats/global` | Global game stats |
| `GET`  | `/api/health` | Server health check |

---

## 📄 License

MIT — free to use, modify and distribute.
