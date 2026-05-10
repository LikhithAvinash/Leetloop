/**
 * routes/progress.js
 * GET  /api/progress         — fetch all keys for the logged-in user
 * PUT  /api/progress/:key    — upsert a single key's value
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/progress — returns { solved_map, streak, settings, joined_series }
router.get('/progress', auth, (req, res) => {
  const userId = req.user.id;
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastOpenedRow = db.prepare("SELECT value FROM user_data WHERE user_id = ? AND key = 'last_opened_date'").get(userId);
    let lastOpenedDate = today;
    if (lastOpenedRow) {
      try { lastOpenedDate = JSON.parse(lastOpenedRow.value); } catch(e) {}
    }

    if (lastOpenedDate < today) {
      const d1 = new Date(lastOpenedDate + 'T00:00:00Z');
      const d2 = new Date(today + 'T00:00:00Z');
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const daysMissed = diffDays - 1;

      // Atomic update to prevent race conditions
      let updated = false;
      if (!lastOpenedRow) {
        try {
          db.prepare(`
            INSERT INTO user_data (user_id, key, value, updated_at)
            VALUES (?, 'last_opened_date', ?, datetime('now'))
          `).run(userId, JSON.stringify(today));
          updated = true;
        } catch (e) {
          // Unique constraint means someone else inserted it
        }
      } else {
        const info = db.prepare(`
          UPDATE user_data 
          SET value = ?, updated_at = datetime('now')
          WHERE user_id = ? AND key = 'last_opened_date' AND value = ?
        `).run(JSON.stringify(today), userId, lastOpenedRow.value);
        updated = info.changes > 0;
      }

      if (updated && daysMissed > 0) {
        db.prepare(`
          UPDATE user_problems 
          SET next_revision_date = date(next_revision_date, '+' || ? || ' days')
          WHERE user_id = ? AND next_revision_date IS NOT NULL AND bracket IN (1, 2)
        `).run(daysMissed, userId);
      }
    } else if (!lastOpenedRow) {
      db.prepare(`
        INSERT INTO user_data (user_id, key, value, updated_at)
        VALUES (?, 'last_opened_date', ?, datetime('now'))
        ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `).run(userId, JSON.stringify(today));
    }

    const rows = db.prepare('SELECT key, value FROM user_data WHERE user_id = ?').all(userId);
    const result = {};
    for (const row of rows) {
      try { result[row.key] = JSON.parse(row.value); }
      catch { result[row.key] = row.value; }
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/progress/:key — upsert a single key
router.put('/progress/:key', auth, (req, res) => {
  const userId = req.user.id;
  const { key } = req.params;
  const { value } = req.body;

  // Whitelist allowed keys to prevent abuse
  const ALLOWED = ['solved_map', 'streak', 'settings', 'joined_series', 'score', 'daily_unsolved', 'daily_revision'];
  if (!ALLOWED.includes(key)) {
    return res.status(400).json({ error: `Unknown key: ${key}` });
  }

  try {
    db.prepare(`
      INSERT INTO user_data (user_id, key, value, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `).run(userId, key, JSON.stringify(value));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
