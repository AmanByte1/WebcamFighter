// server/middleware/achievements.js
// All achievement definitions and unlock checking logic

export const ACHIEVEMENTS = [
  {
    id:          'first_blood',
    name:        'First Blood',
    description: 'Win your first match',
    icon:        '🩸',
    check:       (stats) => stats.wins >= 1,
  },
  {
    id:          'combo_starter',
    name:        'Combo Starter',
    description: 'Land a 3x combo',
    icon:        '⚡',
    check:       (stats) => stats.bestCombo >= 3,
  },
  {
    id:          'combo_king',
    name:        'Combo King',
    description: 'Land a 5x combo',
    icon:        '👑',
    check:       (stats) => stats.bestCombo >= 5,
  },
  {
    id:          'untouchable',
    name:        'Untouchable',
    description: 'Win a match without taking any damage',
    icon:        '🛡️',
    check:       (stats, matchStats) => matchStats?.dmgTaken === 0 && matchStats?.result === 'win',
  },
  {
    id:          'super_fighter',
    name:        'Super Fighter',
    description: 'Use 10 Super Moves total',
    icon:        '💥',
    check:       (stats) => stats.superMoves >= 10,
  },
  {
    id:          'war_veteran',
    name:        'War Veteran',
    description: 'Play 25 matches',
    icon:        '🎖️',
    check:       (stats) => stats.totalMatches >= 25,
  },
  {
    id:          'win_streak_3',
    name:        'On Fire',
    description: 'Win 3 matches in a row',
    icon:        '🔥',
    check:       (stats) => stats.winStreak >= 3,
  },
  {
    id:          'win_streak_5',
    name:        'Unstoppable',
    description: 'Win 5 matches in a row',
    icon:        '🌪️',
    check:       (stats) => stats.winStreak >= 5,
  },
  {
    id:          'ko_artist',
    name:        'KO Artist',
    description: 'Win 10 matches by KO',
    icon:        '🥊',
    check:       (stats) => stats.knockouts >= 10,
  },
  {
    id:          'diamond_rank',
    name:        'Diamond Rank',
    description: 'Reach Diamond tier',
    icon:        '💎',
    check:       (stats, _match, player) => player?.rank?.tier === 'Diamond',
  },
  {
    id:          'centurion',
    name:        'Centurion',
    description: 'Deal 1000 total damage',
    icon:        '⚔️',
    check:       (stats) => stats.totalDmgDealt >= 1000,
  },
  {
    id:          'iron_will',
    name:        'Iron Will',
    description: 'Win a match after being at less than 10 HP',
    icon:        '💪',
    // This is set server-side when saving match
    check:       (_stats, matchStats) => matchStats?.clutchWin === true,
  },
];

/**
 * Check which new achievements a player has unlocked.
 * Returns array of newly unlocked achievement objects.
 */
export function checkAchievements(player, matchStats = null) {
  const existing  = new Set(player.achievements.map(a => a.id));
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    if (existing.has(ach.id)) continue; // already unlocked
    if (ach.check(player.stats, matchStats, player)) {
      newlyUnlocked.push({
        id:          ach.id,
        name:        ach.name,
        description: ach.description,
        icon:        ach.icon,
        unlockedAt:  new Date(),
      });
    }
  }

  return newlyUnlocked;
}

/**
 * Calculate rank points change after a match.
 * Simple ELO-inspired system.
 */
export function calculatePoints(result, currentPoints) {
  const gains = { win: 30, draw: 5, loss: -15 };
  const delta = gains[result] ?? 0;
  return Math.max(0, currentPoints + delta); // never go below 0
}
