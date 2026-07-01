// server/routes/players.js
import { Router }  from 'express';
import { Player }  from '../models/Player.js';
import { Match }   from '../models/Match.js';

const router = Router();

// ── POST /api/players/register ─────────────────────────
// Create or fetch a player by username (guest-style login)
router.post('/register', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const clean = username.trim();
    if (clean.length < 2 || clean.length > 16) {
      return res.status(400).json({ error: 'Username must be 2–16 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      return res.status(400).json({ error: 'Only letters, numbers and _ allowed' });
    }

    // Upsert — create if not exists, return existing if found
    let player = await Player.findOne({ username: clean });
    const isNew = !player;

    if (!player) {
      player = await Player.create({ username: clean });
    } else {
      player.lastSeen = new Date();
      await player.save();
    }

    res.json({
      player: sanitizePlayer(player),
      isNew,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Race condition — username taken between check and insert
      const player = await Player.findOne({ username: req.body.username?.trim() });
      return res.json({ player: sanitizePlayer(player), isNew: false });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/players/:username ─────────────────────────
// Get full player profile
router.get('/:username', async (req, res) => {
  try {
    const player = await Player.findOne({
      username: req.params.username.trim(),
    });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    res.json({ player: sanitizePlayer(player) });
  } catch (err) {
    console.error('Get player error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/players/:username/history ─────────────────
// Get recent match history for a player (last 20)
router.get('/:username/history', async (req, res) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit) || 20, 50);
    const matches = await Match.find({ username: req.params.username })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ matches });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/players/leaderboard/top ──────────────────
// Top 20 players by rank points
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const players = await Player.find({ 'stats.totalMatches': { $gt: 0 } })
      .sort({ 'rank.points': -1 })
      .limit(limit)
      .lean();

    const board = players.map((p, i) => ({
      rank        : i + 1,
      username    : p.username,
      points      : p.rank.points,
      tier        : p.rank.tier,
      wins        : p.stats.wins,
      losses      : p.stats.losses,
      winRate     : p.stats.totalMatches > 0
                      ? Math.round((p.stats.wins / p.stats.totalMatches) * 100)
                      : 0,
      bestCombo   : p.stats.bestCombo,
      winStreak   : p.stats.bestWinStreak,
      totalMatches: p.stats.totalMatches,
    }));

    res.json({ leaderboard: board });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Helpers ────────────────────────────────────────────
function sanitizePlayer(player) {
  return {
    id           : player._id,
    username     : player.username,
    stats        : player.stats,
    achievements : player.achievements,
    rank         : player.rank,
    winRate      : player.stats.totalMatches > 0
                     ? Math.round((player.stats.wins / player.stats.totalMatches) * 100)
                     : 0,
    createdAt    : player.createdAt,
    lastSeen     : player.lastSeen,
  };
}

export default router;
