// server/index.js  —  Shadow Rift API Server (Local MongoDB)
import express   from 'express';
import mongoose  from 'mongoose';
import cors      from 'cors';
import dotenv    from 'dotenv';
import playerRoutes from './routes/players.js';
import matchRoutes  from './routes/matches.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shadow-rift';

// ── Middleware ─────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// ── Request logger ─────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
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
    dbName   : 'shadow-rift (local)',
    uptime   : Math.round(process.uptime()) + 's',
    timestamp: new Date().toLocaleString(),
  });
});

// ── 404 ────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Connect to local MongoDB then start server ─────────
console.log('⏳  Connecting to MongoDB...');
console.log(`    URI: ${MONGO_URI}`);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected (local)');
    console.log(`    Database: shadow-rift`);
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀  Shadow Rift Server is RUNNING!');
      console.log(`    API:    http://localhost:${PORT}`);
      console.log(`    Health: http://localhost:${PORT}/api/health`);
      console.log('');
      console.log('    Open frontend at: http://localhost:5173');
      console.log('    Press Ctrl+C to stop');
    });
  })
  .catch(err => {
    console.error('');
    console.error('❌  MongoDB connection failed!');
    console.error('    Error:', err.message);
    console.error('');
    console.error('    Make sure MongoDB service is running:');
    console.error('    Run this in PowerShell as Admin: net start MongoDB');
    console.error('');
    process.exit(1);
  });
