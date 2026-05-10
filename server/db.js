const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'leettrack.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_data (
    user_id   INTEGER NOT NULL,
    key       TEXT    NOT NULL,
    value     TEXT    NOT NULL DEFAULT '{}',
    updated_at TEXT   NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, key)
  );

  CREATE TABLE IF NOT EXISTS problems (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    leetcode_id  INTEGER UNIQUE,
    name         TEXT NOT NULL,
    difficulty   TEXT NOT NULL,
    category     TEXT NOT NULL,
    leetcode_url TEXT NOT NULL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_problems (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id                 INTEGER NOT NULL DEFAULT 0,
    problem_id              INTEGER NOT NULL REFERENCES problems(id),
    bracket                 INTEGER NOT NULL DEFAULT 1,
    current_effective_score REAL,
    attempt_count           INTEGER NOT NULL DEFAULT 0,
    consecutive_zero_count  INTEGER NOT NULL DEFAULT 0,
    next_revision_date      TEXT,
    added_at                TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    user_problem_id       INTEGER NOT NULL REFERENCES user_problems(id),
    score                 INTEGER NOT NULL,
    hint_count            INTEGER NOT NULL,
    distinct_methods      INTEGER,
    solutions_pasted      TEXT,
    llm_feedback          TEXT,
    effective_score_after REAL,
    attempted_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Migration: add user_id column to user_problems if it doesn't exist ────────
const cols = db.pragma('table_info(user_problems)').map(c => c.name);
if (!cols.includes('user_id')) {
  db.exec(`ALTER TABLE user_problems ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0`);
  console.log('[db] Migrated: added user_id to user_problems');
}

// ── Unique index: one tracking entry per (user, problem) ─────────────────────
try {
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_up_user_problem ON user_problems(user_id, problem_id)`);
} catch (_) { /* index may already exist with different shape — safe to ignore */ }

module.exports = db;
