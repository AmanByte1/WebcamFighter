// server/routes/matches.js
import { Router }  from 'express';
import { Player }  from '../models/Player.js';
import { Match }   from '../models/Match.js';
import { checkAchievements, calculatePoints } from '../middleware/achievements.js';

const router = Router();

// ── POST /api/matches ──────────────────────────────────
// Save a completed match and update player stats
router.post('/', async (req, res) => {
  try {
    const {
      username,
      result,           // 'win' | 'loss' | 'draw'
      playerRoundWins,
      aiRoundWins,
      rounds,           // array of round objects
      stats,            // match-level stats
      duration,
    } = req.body;

    // Basic validation
    if (!username || !result || !['win','loss','draw'].includes(result)) {
      return res.status(400).json({ error: 'Invalid match data' });
    }

    // Find player
    const player = await Player.findOne({ username: username.trim() });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    // ── Calculate rank points ──────────────────────────
    const pointsBefore = player.rank.points;
    const pointsAfter  = calculatePoints(result, pointsBefore);

    // ── Save match document ───────────────────────────
    const match = await Match.create({
      username,
      result,
      playerRoundWins : playerRoundWins || 0,
      aiRoundWins     : aiRoundWins     || 0,
      rounds          : rounds          || [],
      stats           : stats           || {},
      pointsBefore,
      pointsAfter,
      duration        : duration        || 0,
    });

    // ── Update player lifetime stats ───────────────────
    const s = player.stats;
    s.totalMatches++;
    s.totalRounds  += (playerRoundWins || 0) + (aiRoundWins || 0);
    s.totalDmgDealt+= stats?.dmgDealt       || 0;
    s.totalDmgTaken+= stats?.dmgTaken       || 0;
    s.superMoves   += stats?.superMovesUsed || 0;
    s.punchesThrown+= stats?.punchesThrown  || 0;
    s.kicksThrown  += stats?.kicksThrown    || 0;
    s.blocksUsed   += stats?.blocksUsed     || 0;

    if (stats?.bestCombo > s.bestCombo) s.bestCombo = stats.bestCombo;

    if (result === 'win') {
      s.wins++;
      s.winStreak++;
      if (stats?.wasKO) s.knockouts++;
      if (s.winStreak > s.bestWinStreak) s.bestWinStreak = s.winStreak;
    } else if (result === 'loss') {
      s.losses++;
      s.winStreak = 0;
    } else {
      s.draws++;
      s.winStreak = 0;
    }

    // ── Update rank ────────────────────────────────────
    player.rank.points = pointsAfter;
    player.updateTier();
    player.lastSeen    = new Date();

    // ── Check achievements ─────────────────────────────
    const newAchievements = checkAchievements(player, { ...stats, result });
    if (newAchievements.length > 0) {
      player.achievements.push(...newAchievements);
    }

    await player.save();

    res.json({
      match          : match._id,
      pointsBefore,
      pointsAfter,
      pointsDelta    : pointsAfter - pointsBefore,
      newTier        : player.rank.tier,
      newAchievements,
      updatedStats   : player.stats,
    });

  } catch (err) {
    console.error('Save match error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/matches/recent ────────────────────────────
// Recent matches across all players (global feed)
router.get('/recent', async (req, res) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit) || 10, 50);
    const matches = await Match.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ matches });
  } catch (err) {
    console.error('Recent matches error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/matches/stats/global ─────────────────────
// Global game statistics
router.get('/stats/global', async (req, res) => {
  try {
    const [matchCount, playerCount, agg] = await Promise.all([
      Match.countDocuments(),
      Player.countDocuments(),
      Match.aggregate([
        {
          $group: {
            _id        : null,
            totalWins  : { $sum: { $cond: [{ $eq: ['$result','win']  }, 1, 0] } },
            totalLosses: { $sum: { $cond: [{ $eq: ['$result','loss'] }, 1, 0] } },
            totalDraws : { $sum: { $cond: [{ $eq: ['$result','draw'] }, 1, 0] } },
            avgDuration: { $avg: '$duration' },
          },
        },
      ]),
    ]);

    const g = agg[0] || {};
    res.json({
      totalMatches : matchCount,
      totalPlayers : playerCount,
      playerWinRate: matchCount
        ? Math.round((g.totalWins / matchCount) * 100)
        : 0,
      avgMatchDuration: Math.round(g.avgDuration || 0),
    });
  } catch (err) {
    console.error('Global stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
