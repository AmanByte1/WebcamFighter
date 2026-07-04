// server/index.js  —  Shadow Rift API Server (Local MongoDB + Sessions)
import express        from 'express';
import mongoose       from 'mongoose';
import cors           from 'cors';
import dotenv         from 'dotenv';
import session        from 'express-session';
import MongoStore     from 'connect-mongo';
import playerRoutes   from './routes/players.js';
import matchRoutes    from './routes/matches.js';
import sessionRoutes  from './routes/sessions.js';

dotenv.config();

const app       = express();
const PORT      = process.env.PORT      || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shadow-rift';
const SECRET    = process.env.SESSION_SECRET || 'shadow-rift-secret-key-2025';

// ── CORS — must come before session so preflight works ─
app.use(cors({
  origin     : process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods    : ['GET', 'POST', 'DELETE'],
  credentials: true,   // ← required for cookies/sessions to be sent cross-origin
}));

app.use(express.json());

// ── Session middleware ─────────────────────────────────
// Sessions are stored in MongoDB so they survive server restarts
app.use(session({
  secret           : SECRET,
  resave           : false,
  saveUninitialized: false,
  store            : MongoStore.create({
    mongoUrl        : MONGO_URI,
    dbName          : 'shadow-rift',
    collectionName  : 'sessions',       // stored in its own collection
    ttl             : 7 * 24 * 60 * 60, // 7 days in seconds
    autoRemove      : 'native',         // MongoDB TTL index auto-removes expired sessions
  }),
  cookie: {
    maxAge  : 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    httpOnly: true,                     // JS can't access cookie — security best practice
    sameSite: 'lax',
    secure  : false,                    // false for localhost (true only for HTTPS)
  },
  name: 'shadow.sid',                   // custom cookie name (not default 'connect.sid')
}));

// ── Request logger ─────────────────────────────────────
app.use((req, _res, next) => {
  const user = req.session?.username || 'guest';
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path} | user: ${user}`);
  next();
});

// ── Routes ─────────────────────────────────────────────
app.use('/api/session', sessionRoutes);   // session login/logout/check
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);

// ── Health check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status         : 'ok',
    db             : mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbName         : 'shadow-rift (local)',
    sessionActive  : !!req.session?.username,
    loggedInAs     : req.session?.username || null,
    uptime         : Math.round(process.uptime()) + 's',
    timestamp      : new Date().toLocaleString(),
  });
});

// ── 404 ────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Connect MongoDB then start ─────────────────────────
console.log('⏳  Connecting to MongoDB...');

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected (local)');
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀  Shadow Rift Server is RUNNING!');
      console.log(`    API    : http://localhost:${PORT}`);
      console.log(`    Health : http://localhost:${PORT}/api/health`);
      console.log(`    Session: http://localhost:${PORT}/api/session/check`);
      console.log('');
      console.log('    Open frontend: http://localhost:5173');
      console.log('    Press Ctrl+C to stop');
    });
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    console.error('    Run in PowerShell as Admin: net start MongoDB');
    process.exit(1);
  });
