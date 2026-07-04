# ⚔️ Shadow Rift — Webcam Fighting Game
### Full Stack Development (FSD) Project

> A browser-based fighting game controlled by your body using AI pose detection, with a Node.js + Express + MongoDB backend for leaderboards, player profiles, match history and achievements.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | MongoDB (local) |
| Pose AI | MediaPipe Pose |
| Rendering | HTML5 Canvas 2D |

---

## 🚀 How to Run (Quickest Way)

### Prerequisites
- Node.js installed → [nodejs.org](https://nodejs.org)
- MongoDB 8.3 installed and running as a service

### Just double-click:
```
start.bat
```
This will:
1. Start MongoDB service
2. Start the backend server (port 5000)
3. Start the frontend (port 5173)
4. Open the game in your browser automatically

---

## 🚀 Manual Setup (Step by Step)

### 1. Install frontend dependencies
```bash
# In the root shadow-rift folder
npm install
```

### 2. Install backend dependencies
```bash
cd server
npm install
```

### 3. Start MongoDB (if not already running)
```powershell
# Run in PowerShell as Administrator
net start MongoDB
```

### 4. Start the backend
```bash
# In the server folder
npm run dev
```
You should see:
```
✅  MongoDB connected (local)
🚀  Shadow Rift Server is RUNNING!
    API: http://localhost:5000
```

### 5. Start the frontend
```bash
# In the root shadow-rift folder (new terminal)
npm run dev
```

### 6. Open the game
Go to **http://localhost:5173** in Chrome or Edge

---

## 🎮 How to Play

1. Enter your fighter name
2. Click **Fight Now**
3. Allow camera access
4. Stand back so your upper body is visible
5. Fight using your body!

### Controls

| Body Movement | Action |
|---|---|
| Raise one wrist above shoulder | Punch |
| Both wrists above shoulders | Block |
| Raise knee above hip | Kick |
| Crouch down | Dodge |
| Both arms above head (power bar full) | Super Move |
| Shift body left / right | Move |

### Keyboard (if no camera)
| Key | Action |
|---|---|
| A / D | Move left / right |
| Z | Punch |
| S | Kick |
| X | Block |
| Space | Super Move |

---

## 🗄️ Database Features

- **Player Profiles** — username, stats, rank tier
- **Leaderboard** — global top 20 by rank points
- **Match History** — every match saved with round breakdown
- **Achievements** — 12 unlockable achievements
- **Rank System** — Bronze → Silver → Gold → Platinum → Diamond

### MongoDB Collections
| Collection | Stores |
|---|---|
| `players` | Username, stats, rank, achievements |
| `matches` | Match results, round data, damage stats |

---

## 📁 Project Structure

```
shadow-rift/
├── start.bat                   ← Double-click to start everything
├── stop.bat                    ← Double-click to stop everything
│
├── server/                     ← Node.js + Express backend
│   ├── index.js                ← Server entry + MongoDB connect
│   ├── .env                    ← Local config (MongoDB URI)
│   ├── models/
│   │   ├── Player.js           ← Player schema
│   │   └── Match.js            ← Match schema
│   ├── routes/
│   │   ├── players.js          ← Player API endpoints
│   │   └── matches.js          ← Match API endpoints
│   └── middleware/
│       └── achievements.js     ← Achievement logic
│
└── src/                        ← React frontend
    ├── App.jsx                 ← Main app
    ├── context/
    │   └── PlayerContext.jsx   ← Global player state
    ├── services/
    │   └── api.js              ← API calls to backend
    ├── components/             ← All UI components
    ├── game/                   ← Game engine (Canvas)
    ├── hooks/                  ← React hooks
    └── styles/                 ← CSS files
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/players/register` | Register or login player |
| GET | `/api/players/:username` | Get player profile |
| GET | `/api/players/:username/history` | Match history |
| GET | `/api/players/leaderboard/top` | Top 20 leaderboard |
| POST | `/api/matches` | Save match result |
| GET | `/api/matches/recent` | Recent matches |
| GET | `/api/health` | Server health check |

---

## 👨‍💻 Developer

**Student Name:** Aman  
**Subject:** Full Stack Development (FSD)  
**Semester End Exam Project**

---

## 📄 License
MIT
