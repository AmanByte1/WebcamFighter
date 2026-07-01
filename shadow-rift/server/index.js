// server/index.js  —  Shadow Rift API Server
import express    from 'express';
import mongoose   from 'mongoose';
import cors       from 'cors';
import dotenv     from 'dotenv';
import playerRoutes from './routes/players.js';
import matchRoutes  from './routes/matches.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// ── Request logger (dev) ───────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────────
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);

// ── Health check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status   : 'ok',
    db       : mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime   : Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Connect MongoDB then start ─────────────────────────
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌  MONGODB_URI not set in .env');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
      console.log(`    Health: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
