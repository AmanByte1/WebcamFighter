// server/routes/sessions.js
// Handles session-based login, logout and session check
import { Router } from 'express';
import { Player } from '../models/Player.js';

const router = Router();

// ── POST /api/session/login ────────────────────────────
// Register/login player AND create a session
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;

    // Validate username
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

    // Create player if new, or fetch existing
    let player = await Player.findOne({ username: clean });
    const isNew = !player;

    if (!player) {
      player = await Player.create({ username: clean });
      console.log(`  ✨ New player created: ${clean}`);
    } else {
      player.lastSeen = new Date();
      await player.save();
      console.log(`  👋 Returning player: ${clean}`);
    }

    // ── Save to session ──────────────────────────────
    req.session.username  = player.username;
    req.session.playerId  = player._id.toString();
    req.session.loginTime = new Date().toISOString();

    // Save session explicitly then respond
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session could not be saved' });
      }
      res.json({
        message : isNew ? 'Welcome, new fighter!' : `Welcome back, ${clean}!`,
        isNew,
        player  : sanitizePlayer(player),
        session : {
          id       : req.session.id,
          username : req.session.username,
          loginTime: req.session.loginTime,
        },
      });
    });

  } catch (err) {
    if (err.code === 11000) {
      // Race condition — username already exists (fine, just fetch it)
      const player = await Player.findOne({ username: req.body.username?.trim() });
      if (player) {
        req.session.username = player.username;
        req.session.playerId = player._id.toString();
        return req.session.save(() => {
          res.json({ message: `Welcome back, ${player.username}!`, isNew: false, player: sanitizePlayer(player) });
        });
      }
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ── GET /api/session/check ─────────────────────────────
// Check if a session already exists (called on app load)
// If yes → return player data so user skips login screen
router.get('/check', async (req, res) => {
  try {
    // No active session
    if (!req.session?.username) {
      return res.json({ loggedIn: false });
    }

    // Session exists — fetch fresh player data from DB
    const player = await Player.findOne({ username: req.session.username });
    if (!player) {
      // Player deleted from DB — destroy stale session
      req.session.destroy(() => {});
      return res.json({ loggedIn: false });
    }

    // Refresh lastSeen
    player.lastSeen = new Date();
    await player.save();

    res.json({
      loggedIn  : true,
      username  : req.session.username,
      loginTime : req.session.loginTime,
      player    : sanitizePlayer(player),
    });

  } catch (err) {
    console.error('Session check error:', err);
    res.json({ loggedIn: false });
  }
});

// ── DELETE /api/session/logout ─────────────────────────
// Destroy session — user goes back to login screen
router.delete('/logout', (req, res) => {
  const username = req.session?.username || 'unknown';

  req.session.destroy(err => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    // Clear the cookie on client side too
    res.clearCookie('shadow.sid');
    console.log(`  👋 ${username} logged out`);
    res.json({ message: 'Logged out successfully' });
  });
});

// ── GET /api/session/info ──────────────────────────────
// Returns raw session info — useful for exam demo
router.get('/info', (req, res) => {
  res.json({
    sessionId  : req.session.id,
    username   : req.session.username   || null,
    playerId   : req.session.playerId   || null,
    loginTime  : req.session.loginTime  || null,
    isActive   : !!req.session.username,
    cookieName : 'shadow.sid',
    cookieMaxAge: '7 days',
  });
});

// ── Helper ─────────────────────────────────────────────
function sanitizePlayer(player) {
  return {
    id          : player._id,
    username    : player.username,
    stats       : player.stats,
    achievements: player.achievements,
    rank        : player.rank,
    winRate     : player.stats.totalMatches > 0
                    ? Math.round((player.stats.wins / player.stats.totalMatches) * 100)
                    : 0,
    createdAt   : player.createdAt,
    lastSeen    : player.lastSeen,
  };
}

export default router;
