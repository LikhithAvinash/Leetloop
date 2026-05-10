/**
 * scheduler.js — Pure SRS logic. No DB calls, no side effects.
 */

// Interval table: [score][attempt_index] → days
// attempt_index: 0 = 1st revision, 1 = 2nd, 2 = 3rd, 3 = 4th+
// Score range is 0–3
const INTERVAL_TABLE = {
  3: [14, 30, 60, 120],   // optimal, no hints — solid recall
  2: [7, 14, 28, 60],     // 1 hint or brute-force clean
  1: [3, 7, 14, 28],      // shaky
  0: [1, 1, 1, 1],        // failed — try again tomorrow
};

/**
 * Compute score for the OPTIMAL approach (hint-based).
 *   didn't solve → -1
 *   0 hints → 3
 *   1 hint  → 2
 *   2 hints → 1
 *   3+ hints → 0
 */
function computeOptimalScore(hintCount) {
  if (hintCount < 0) return -1;  // didn't solve
  if (hintCount >= 3) return 0;
  if (hintCount === 2) return 1;
  if (hintCount === 1) return 2;
  return 3;
}

/**
 * Compute score for the BRUTE FORCE approach (hint-based).
 *   didn't solve → -1
 *   0 hints → 2
 *   1 hint  → 1
 *   2+ hints → 0
 */
function computeBruteScore(hintCount) {
  if (hintCount < 0) return -1;  // didn't solve
  if (hintCount >= 2) return 0;
  if (hintCount === 1) return 1;
  return 2;
}

/**
 * Compute the final score from submitted solutions.
 *   - Only optimal submitted:       optimalScore (clamped to 0 min)
 *   - Only brute force submitted:    bruteScore  (clamped to 0 min)
 *   - Both submitted, both 0 hints:  3  (special case — perfect recall)
 *   - Both submitted, otherwise:     floor((optimalScore + bruteScore) / 2), clamped to 0 min
 *
 * "Didn't solve" gives -1 per approach, which drags down the average.
 * Example: optimal score 2 + brute didn't solve (-1) → floor((2+(-1))/2) = floor(0.5) = 0
 */
function computeFinalScore(optimalHints, bruteHints) {
  const hasOptimal = optimalHints !== null && optimalHints !== undefined;
  const hasBrute   = bruteHints !== null && bruteHints !== undefined;

  if (hasOptimal && hasBrute) {
    const os = computeOptimalScore(optimalHints);
    const bs = computeBruteScore(bruteHints);

    // Special case: both solved without hints → perfect score 3
    if (optimalHints === 0 && bruteHints === 0) {
      return { score: 3, optimalScore: os, bruteScore: bs };
    }

    const combined = Math.floor((os + bs) / 2);
    return { score: Math.max(0, combined), optimalScore: os, bruteScore: bs };
  }
  if (hasOptimal) {
    const os = computeOptimalScore(optimalHints);
    return { score: Math.max(0, os), optimalScore: os, bruteScore: null };
  }
  if (hasBrute) {
    const bs = computeBruteScore(bruteHints);
    return { score: Math.max(0, bs), optimalScore: null, bruteScore: bs };
  }
  return { score: 0, optimalScore: null, bruteScore: null };
}

/**
 * Compute final score from an array of N solutions.
 * Each solution: { type: 'optimal' | 'brute', hints: number }
 *   hints < 0  → "didn't solve" → individual score -1
 *
 * Final score = Math.floor(sum / N), clamped to [0, 3]
 *
 * Example:
 *   optimal(0 hints)=3, brute(1 hint)=1, brute(0 hints)=2
 *   → floor((3+1+2)/3) = floor(2) = 2
 */
function computeFinalScoreMulti(solutions) {
  if (!solutions || solutions.length === 0) {
    return { score: 0, solutionScores: [] };
  }

  const solutionScores = solutions.map(s => {
    const hints = typeof s.hints === 'number' ? s.hints : parseInt(s.hints) || 0;
    if (s.type === 'brute') return computeBruteScore(hints);
    return computeOptimalScore(hints);
  });

  const sum = solutionScores.reduce((acc, v) => acc + v, 0);
  const raw = Math.floor(sum / solutions.length);
  const score = Math.max(0, Math.min(3, raw));

  return { score, solutionScores };
}

/**
 * Blend current score with history to get effective score.
 * attemptNumber: 1 = first revision ever, 2 = second, 3+ = beyond
 */
function computeEffectiveScore(prevEffective, currentScore, attemptNumber) {
  let rawScore;
  if (attemptNumber === 1) rawScore = currentScore;
  else if (attemptNumber === 2) rawScore = prevEffective * 0.4 + currentScore * 0.6;
  else rawScore = prevEffective * 0.01 + currentScore * 0.99;

  return Math.round(rawScore * 100) / 100;
}

/**
 * Look up interval days from effective score, attempt count, AND current score.
 * The lookup is capped by the current raw score so a bad score today
 * can NEVER result in a generous interval.
 */
function getIntervalDays(effectiveScore, attemptCount, currentScore) {
  const effLookup = Math.floor(effectiveScore);
  // Cap by current raw score: bad score today = short interval
  const cappedScore = Math.min(effLookup, Math.max(0, currentScore));
  const clamped = Math.max(0, Math.min(3, cappedScore));
  const intervals = INTERVAL_TABLE[clamped];
  const idx = Math.min(attemptCount, 3); // 4th+ all use index 3
  return intervals[idx];
}

/**
 * Add days to a date string (YYYY-MM-DD) and return new date string.
 */
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

module.exports = {
  computeOptimalScore,
  computeBruteScore,
  computeFinalScore,
  computeFinalScoreMulti,
  computeEffectiveScore,
  getIntervalDays,
  addDays,
  todayStr,
  INTERVAL_TABLE,
};
