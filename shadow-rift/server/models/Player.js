// server/models/Player.js
import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  id:         { type: String, required: true },
  name:       { type: String, required: true },
  description:{ type: String, required: true },
  icon:       { type: String, default: '🏆' },
  unlockedAt: { type: Date,   default: Date.now },
}, { _id: false });

const playerSchema = new mongoose.Schema({
  username: {
    type:      String,
    required:  true,
    unique:    true,
    trim:      true,
    minlength: 2,
    maxlength: 16,
    match:     /^[a-zA-Z0-9_]+$/,
  },

  // ── Lifetime stats ────────────────────────────────────
  stats: {
    wins:          { type: Number, default: 0 },
    losses:        { type: Number, default: 0 },
    draws:         { type: Number, default: 0 },
    totalMatches:  { type: Number, default: 0 },
    totalRounds:   { type: Number, default: 0 },
    totalDmgDealt: { type: Number, default: 0 },
    totalDmgTaken: { type: Number, default: 0 },
    bestCombo:     { type: Number, default: 0 },
    superMoves:    { type: Number, default: 0 },
    knockouts:     { type: Number, default: 0 }, // KO wins (opponent HP = 0)
    winStreak:     { type: Number, default: 0 },
    bestWinStreak: { type: Number, default: 0 },

    // Move breakdown
    punchesThrown: { type: Number, default: 0 },
    kicksThrown:   { type: Number, default: 0 },
    blocksUsed:    { type: Number, default: 0 },
  },

  // ── Achievements ──────────────────────────────────────
  achievements: [achievementSchema],

  // ── Ranking ───────────────────────────────────────────
  rank: {
    points: { type: Number, default: 0 }, // ELO-style points
    tier:   { type: String, default: 'Bronze', enum: ['Bronze','Silver','Gold','Platinum','Diamond'] },
  },

  lastSeen: { type: Date, default: Date.now },
}, {
  timestamps: true,  // adds createdAt, updatedAt
});

// ── Virtual: win rate ─────────────────────────────────
playerSchema.virtual('winRate').get(function () {
  if (!this.stats.totalMatches) return 0;
  return Math.round((this.stats.wins / this.stats.totalMatches) * 100);
});

// ── Method: update rank tier ──────────────────────────
playerSchema.methods.updateTier = function () {
  const p = this.rank.points;
  if      (p >= 1500) this.rank.tier = 'Diamond';
  else if (p >= 1000) this.rank.tier = 'Platinum';
  else if (p >= 600)  this.rank.tier = 'Gold';
  else if (p >= 250)  this.rank.tier = 'Silver';
  else                this.rank.tier = 'Bronze';
};

// ── Indexes ───────────────────────────────────────────
playerSchema.index({ 'rank.points': -1 });
playerSchema.index({ 'stats.wins':  -1 });
playerSchema.index({ username: 1 }, { unique: true });

export const Player = mongoose.model('Player', playerSchema);
