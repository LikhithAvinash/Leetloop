const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/problems/stats — score bracket distribution for the logged-in user
router.get('/problems/stats', auth, (req, res) => {
  const userId = req.user.id;
  try {
    const scoreDist = db.prepare(`
      SELECT
        CASE
          WHEN current_effective_score IS NULL THEN 0
          ELSE MIN(3, MAX(0, ROUND(current_effective_score)))
        END AS score_bracket,
        COUNT(*) AS count
      FROM user_problems
      WHERE bracket = 2 AND user_id = ?
      GROUP BY score_bracket
      ORDER BY score_bracket ASC
    `).all(userId);

    const bracket1 = db.prepare(`SELECT COUNT(*) AS count FROM user_problems WHERE bracket = 1 AND user_id = ?`).get(userId);
    const bracket2 = db.prepare(`SELECT COUNT(*) AS count FROM user_problems WHERE bracket = 2 AND user_id = ?`).get(userId);
    const total = db.prepare(`SELECT COUNT(*) AS count FROM user_problems WHERE user_id = ?`).get(userId);

    const distribution = [0, 0, 0, 0];
    for (const row of scoreDist) {
      distribution[row.score_bracket] = row.count;
    }

    const avgRow = db.prepare(`
      SELECT AVG(COALESCE(current_effective_score, 0)) AS avg_score
      FROM user_problems WHERE bracket = 2 AND user_id = ?
    `).get(userId);
    const avgEffective = avgRow && avgRow.avg_score !== null
      ? Math.round((avgRow.avg_score / 3) * 100)
      : 0;

    res.json({
      total: total.count,
      unsolved: bracket1.count,
      inRevision: bracket2.count,
      distribution,
      averageEffectiveScore: avgEffective,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/problems — list problems for the logged-in user
router.get('/problems', auth, (req, res) => {
  const userId = req.user.id;
  const { bracket } = req.query;
  let query = `
    SELECT
      up.id AS user_problem_id,
      up.bracket,
      up.current_effective_score,
      up.attempt_count,
      up.consecutive_zero_count,
      up.next_revision_date,
      up.added_at,
      p.id AS problem_id,
      p.leetcode_id,
      p.name,
      p.difficulty,
      p.category,
      p.leetcode_url,
      MAX(CASE WHEN a.hint_count > 0 THEN 1 ELSE 0 END) AS has_hint_attempt,
      MAX(CASE WHEN a.hint_count = 0 THEN 1 ELSE 0 END) AS has_nohint_attempt
    FROM user_problems up
    JOIN problems p ON up.problem_id = p.id
    LEFT JOIN attempts a ON a.user_problem_id = up.id
    WHERE up.user_id = ?
  `;
  const params = [userId];
  if (bracket) { query += ' AND up.bracket = ?'; params.push(parseInt(bracket)); }
  query += ' GROUP BY up.id ORDER BY up.added_at DESC';
  try {
    res.json(db.prepare(query).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// POST /api/problems — track a problem for the logged-in user
router.post('/problems', auth, (req, res) => {
  const userId = req.user.id;
  const { leetcode_id, name, difficulty, category, leetcode_url } = req.body;
  if (!name || !difficulty || !category)
    return res.status(400).json({ error: 'name, difficulty, category are required' });
  try {
    // Upsert into shared problems catalogue
    db.prepare(`
      INSERT INTO problems (leetcode_id, name, difficulty, category, leetcode_url)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(leetcode_id) DO UPDATE SET
        name=excluded.name, difficulty=excluded.difficulty,
        category=excluded.category, leetcode_url=excluded.leetcode_url
    `).run(leetcode_id || null, name, difficulty, category, leetcode_url || '');

    const problem = leetcode_id
      ? db.prepare('SELECT * FROM problems WHERE leetcode_id = ?').get(leetcode_id)
      : db.prepare('SELECT * FROM problems WHERE name = ?').get(name);

    // Check if THIS user is already tracking it
    const existing = db.prepare('SELECT * FROM user_problems WHERE user_id = ? AND problem_id = ?').get(userId, problem.id);
    if (existing) return res.status(409).json({ error: 'Already tracked', user_problem: existing });

    const r = db.prepare('INSERT INTO user_problems (user_id, problem_id, bracket) VALUES (?, ?, 1)').run(userId, problem.id);
    res.status(201).json({ problem, user_problem: db.prepare('SELECT * FROM user_problems WHERE id = ?').get(r.lastInsertRowid) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/problems/:id/solve — assign an appearance day (Bracket 1)
router.put('/problems/:id/solve', auth, (req, res) => {
  const userId = req.user.id;
  const id = parseInt(req.params.id);
  try {
    const up = db.prepare('SELECT * FROM user_problems WHERE id = ? AND user_id = ?').get(id, userId);
    if (!up) return res.status(404).json({ error: 'Not found' });
    if (up.bracket === 2) return res.status(400).json({ error: 'Already in Bracket 2' });

    // Assign a random day between 2 and 5 days from now
    const daysOffset = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, or 5
    db.prepare(`UPDATE user_problems SET bracket=1, next_revision_date=date('now', '+' || ? || ' days') WHERE id=?`).run(daysOffset, id);
    res.json(db.prepare('SELECT * FROM user_problems WHERE id = ?').get(id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/problems/:id/attempts — attempt history for a user's problem
router.get('/problems/:id/attempts', auth, (req, res) => {
  const userId = req.user.id;
  const id = parseInt(req.params.id);
  try {
    // Verify ownership first
    const up = db.prepare('SELECT id FROM user_problems WHERE id = ? AND user_id = ?').get(id, userId);
    if (!up) return res.status(404).json({ error: 'Not found' });

    res.json(db.prepare(`
      SELECT a.*, p.name AS problem_name, p.difficulty, p.category
      FROM attempts a
      JOIN user_problems up ON a.user_problem_id = up.id
      JOIN problems p ON up.problem_id = p.id
      WHERE a.user_problem_id = ?
      ORDER BY a.attempted_at DESC
    `).all(id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
