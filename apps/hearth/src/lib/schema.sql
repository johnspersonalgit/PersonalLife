CREATE TABLE IF NOT EXISTS couples (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  categories TEXT NOT NULL DEFAULT '["us","heard","load","gratitude","dreams","play"]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id),
  name TEXT NOT NULL,
  pin_hash TEXT,
  avatar TEXT,
  color TEXT,
  reminder_time TEXT NOT NULL DEFAULT '20:00',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'question',
  options TEXT
);

CREATE TABLE IF NOT EXISTS days (
  id INTEGER PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id),
  day TEXT NOT NULL,
  prompt_id INTEGER NOT NULL REFERENCES prompts(id),
  answerer_id INTEGER REFERENCES members(id),
  UNIQUE(couple_id, day)
);

CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY,
  day_id INTEGER NOT NULL REFERENCES days(id),
  member_id INTEGER NOT NULL REFERENCES members(id),
  mood INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(day_id, member_id)
);

CREATE TABLE IF NOT EXISTS guesses (
  id INTEGER PRIMARY KEY,
  day_id INTEGER NOT NULL REFERENCES days(id),
  member_id INTEGER NOT NULL REFERENCES members(id),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(day_id, member_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id),
  member_id INTEGER NOT NULL REFERENCES members(id),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nudges (
  id INTEGER PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id),
  member_id INTEGER NOT NULL REFERENCES members(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  seen_by INTEGER
);

CREATE TABLE IF NOT EXISTS streak_meta (
  couple_id INTEGER PRIMARY KEY REFERENCES couples(id),
  best INTEGER NOT NULL DEFAULT 0,
  celebrated TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS echoes (
  id INTEGER PRIMARY KEY,
  day_id INTEGER NOT NULL REFERENCES days(id),
  member_id INTEGER NOT NULL REFERENCES members(id),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
