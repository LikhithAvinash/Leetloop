const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { getCategoryPriority } = require('../proxy');
const { addDays, todayStr } = require('../scheduler');

const DIFFICULTY_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

function buildQueue(rows) {
  return rows.sort((a, b) => {
    if (b.consecutive_zero_count !== a.consecutive_zero_count)
      return b.consecutive_zero_count - a.consecutive_zero_count;
    const catDiff = getCategoryPriority(a.category) - getCategoryPriority(b.category);
    if (catDiff !== 0) return catDiff;
    return new Date(a.next_revision_date) - new Date(b.next_revision_date);
  });
}

// ─── Daily Shift Logic ──────────────────────────────────────────────────────────
function shiftDatesIfMissed(userId) {
  const today = todayStr();
  const row = db.prepare(`SELECT value FROM user_data WHERE user_id = ? AND key = 'last_opened_date'`).get(userId);
  let missedDays = 0;
  if (row) {
    try {
      const lastOpened = JSON.parse(row.value);
      const dA = new Date(today + 'T00:00:00Z');
      const dB = new Date(lastOpened + 'T00:00:00Z');
      const diff = Math.floor((dA - dB) / (1000 * 60 * 60 * 24));
      if (diff > 1) {
        missedDays = diff - 1;
      }
    } catch(e) {}
  }

  if (missedDays > 0) {
    db.prepare(`
      UPDATE user_problems
      SET next_revision_date = date(next_revision_date, '+' || ? || ' days')
      WHERE user_id = ? AND next_revision_date IS NOT NULL
    `).run(missedDays, userId);
  }

  // Update last_opened_date
  db.prepare(`
    INSERT INTO user_data (user_id, key, value, updated_at)
    VALUES (?, 'last_opened_date', ?, datetime('now'))
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(userId, JSON.stringify(today));
}

// GET /api/queue/today — today's revision problems for the logged-in user
router.get('/queue/today', auth, (req, res) => {
  const userId = req.user.id;
  try {
    shiftDatesIfMissed(userId);
  } catch (err) {
    console.warn('Shift dates failed:', err);
  }
  const today = todayStr();
  try {
    const rows = db.prepare(`
      SELECT
        up.id AS user_problem_id,
        up.bracket,
        up.current_effective_score,
        up.attempt_count,
        up.consecutive_zero_count,
        up.next_revision_date,
        p.id AS problem_id,
        p.leetcode_id,
        p.name,
        p.difficulty,
        p.category,
        p.leetcode_url
      FROM user_problems up
      JOIN problems p ON up.problem_id = p.id
      WHERE up.bracket IN (1, 2) AND up.next_revision_date <= ? AND up.user_id = ?
    `).all(today, userId);

    const sorted = buildQueue(rows);
    res.json(sorted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/queue/upcoming — next 7 days for the logged-in user
router.get('/queue/upcoming', auth, (req, res) => {
  const userId = req.user.id;
  const today = todayStr();
  const in7Days = addDays(today, 7);
  try {
    const rows = db.prepare(`
      SELECT
        up.id AS user_problem_id,
        up.next_revision_date,
        p.name,
        p.difficulty,
        p.category,
        p.leetcode_url,
        up.current_effective_score
      FROM user_problems up
      JOIN problems p ON up.problem_id = p.id
      WHERE up.bracket = 2
        AND up.next_revision_date > ?
        AND up.next_revision_date <= ?
        AND up.user_id = ?
      ORDER BY up.next_revision_date ASC
    `).all(today, in7Days, userId);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
