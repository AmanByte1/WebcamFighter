// server/models/Match.js
import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  winner:      { type: String, enum: ['player','ai','draw'], required: true },
  playerHpEnd: { type: Number, required: true }, // HP remaining at end of round
  aiHpEnd:     { type: Number, required: true },
  duration:    { type: Number, required: true }, // seconds
}, { _id: false });

const matchSchema = new mongoose.Schema({
  // Who played
  username: {
    type:     String,
    required: true,
    index:    true,
  },

  // Overall result
  result: {
    type:     String,
    enum:     ['win', 'loss', 'draw'],
    required: true,
  },

  // Score (e.g. 2-1)
  playerRoundWins: { type: Number, required: true },
  aiRoundWins:     { type: Number, required: true },

  // Per-round breakdown
  rounds: [roundSchema],

  // Performance
  stats: {
    dmgDealt:       { type: Number, default: 0 },
    dmgTaken:       { type: Number, default: 0 },
    bestCombo:      { type: Number, default: 0 },
    superMovesUsed: { type: Number, default: 0 },
    punchesThrown:  { type: Number, default: 0 },
    kicksThrown:    { type: Number, default: 0 },
    blocksUsed:     { type: Number, default: 0 },
    wasKO:          { type: Boolean, default: false }, // won by KO (not time)
  },

  // Rank points change
  pointsBefore: { type: Number, default: 0 },
  pointsAfter:  { type: Number, default: 0 },

  // Match duration in seconds
  duration: { type: Number, default: 0 },

}, {
  timestamps: true, // createdAt = when match was played
});

matchSchema.index({ username: 1, createdAt: -1 }); // for history queries
matchSchema.index({ createdAt: -1 });               // for recent matches feed

export const Match = mongoose.model('Match', matchSchema);
