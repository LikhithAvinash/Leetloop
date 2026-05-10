const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { computeFinalScoreMulti, computeEffectiveScore, getIntervalDays, addDays, todayStr } = require('../scheduler');

// POST /api/attempts — Submit a revision attempt
router.post('/attempts', auth, (req, res) => {
  const userId = req.user.id;
  const { user_problem_id, solutions: rawSolutions, optimal_hints, brute_hints, optimal_code, brute_code } = req.body;

  if (user_problem_id === undefined) {
    return res.status(400).json({ error: 'user_problem_id is required' });
  }

  // ─── Normalise input: support new solutions[] array OR legacy two-field format ─
  let solutionsList = null;

  if (rawSolutions && Array.isArray(rawSolutions) && rawSolutions.length > 0) {
    // New format: [{ type, hints, code? }, ...]
    solutionsList = rawSolutions.map(s => ({
      type:  s.type === 'brute' ? 'brute' : 'optimal',
      hints: typeof s.hints === 'number' ? s.hints : parseInt(s.hints) || 0,
      code:  (s.code || '').trim(),
    }));
  } else {
    // Legacy two-field format
    const hasOptimal = optimal_hints !== null && optimal_hints !== undefined;
    const hasBrute   = brute_hints !== null && brute_hints !== undefined;
    if (!hasOptimal && !hasBrute) {
      return res.status(400).json({ error: 'At least one solution (solutions array, optimal_hints, or brute_hints) is required' });
    }
    solutionsList = [];
    if (hasOptimal) solutionsList.push({ type: 'optimal', hints: parseInt(optimal_hints) || 0, code: (optimal_code || '').trim() });
    if (hasBrute)   solutionsList.push({ type: 'brute',   hints: parseInt(brute_hints) || 0,   code: (brute_code || '').trim()   });
  }

  if (!solutionsList || solutionsList.length === 0) {
    return res.status(400).json({ error: 'At least one solution is required' });
  }

  try {
    const up = db.prepare(`
      SELECT up.*, p.name AS problem_name
      FROM user_problems up
      JOIN problems p ON up.problem_id = p.id
      WHERE up.id = ? AND up.user_id = ?
    `).get(user_problem_id, userId);

    if (!up) return res.status(404).json({ error: 'User problem not found' });
    if (up.bracket !== 1 && up.bracket !== 2) return res.status(400).json({ error: 'Problem must be in Bracket 1 or 2 to attempt' });

    // ─── Compute score ────────────────────────────────────────────────────────
    const { score, solutionScores } = computeFinalScoreMulti(solutionsList);

    // ─── SRS math ─────────────────────────────────────────────────────────────
    const attemptNumber = up.attempt_count + 1;
    const newEffective  = computeEffectiveScore(up.current_effective_score || 0, score, attemptNumber);
    const intervalDays  = getIntervalDays(newEffective, up.attempt_count, score);
    const nextDate      = addDays(todayStr(), intervalDays);

    // Consecutive zero logic
    let newConsecutiveZeros = score <= 0 ? up.consecutive_zero_count + 1 : 0;
    const eject = newConsecutiveZeros >= 2;

    // ─── Build storage strings ────────────────────────────────────────────────
    const solutionParts = solutionsList.map((s, i) =>
      `=== SOLUTION ${i + 1} (${s.type.toUpperCase()}) ===\n${s.code || '(no code pasted)'}`
    );

    const maxHint = Math.max(...solutionsList.map(s => Math.max(0, s.hints)));
    const distinctMethods = solutionsList.length;

    const feedbackToStore = {
      solutions: solutionsList.map((s, i) => ({
        type:  s.type,
        hints: s.hints,
        score: solutionScores[i],
      })),
    };

    const attemptResult = db.prepare(`
      INSERT INTO attempts (user_problem_id, score, hint_count, distinct_methods, solutions_pasted, llm_feedback, effective_score_after, attempted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      user_problem_id,
      score,
      maxHint,
      distinctMethods,
      solutionParts.join('\n\n--- SOLUTION SEPARATOR ---\n\n'),
      JSON.stringify(feedbackToStore),
      newEffective
    );

    // Update user_problem
    if (eject) {
      db.prepare(`
        UPDATE user_problems
        SET bracket = 1,
            current_effective_score = NULL,
            attempt_count = 0,
            consecutive_zero_count = 0,
            next_revision_date = NULL
        WHERE id = ?
      `).run(user_problem_id);
    } else {
      db.prepare(`
        UPDATE user_problems
        SET bracket = 2,
            current_effective_score = ?,
            attempt_count = attempt_count + 1,
            consecutive_zero_count = ?,
            next_revision_date = ?
        WHERE id = ?
      `).run(newEffective, newConsecutiveZeros, nextDate, user_problem_id);
    }

    const updatedProblem = db.prepare('SELECT * FROM user_problems WHERE id = ?').get(user_problem_id);

    res.json({
      attempt_id:       attemptResult.lastInsertRowid,
      score,
      solution_scores:  solutionScores,
      solution_types:   solutionsList.map(s => s.type),
      effective_score:  newEffective,
      next_revision_date: eject ? null : nextDate,
      interval_days:    eject ? null : intervalDays,
      ejected:          eject,
      user_problem:     updatedProblem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
