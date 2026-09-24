export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS surahs (
  id INTEGER PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  ayah_count INTEGER NOT NULL,
  revelation_type TEXT
);

CREATE TABLE IF NOT EXISTS ayahs (
  id INTEGER PRIMARY KEY,
  surah_id INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  page INTEGER,
  juz INTEGER,
  hizb INTEGER,
  rub INTEGER,
  sajdah INTEGER DEFAULT 0,
  FOREIGN KEY (surah_id) REFERENCES surahs(id)
);
CREATE INDEX IF NOT EXISTS idx_ayahs_surah ON ayahs(surah_id);
CREATE INDEX IF NOT EXISTS idx_ayahs_page ON ayahs(page);
CREATE INDEX IF NOT EXISTS idx_ayahs_juz ON ayahs(juz);

CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  theme TEXT DEFAULT 'auto',
  font_size INTEGER DEFAULT 24,
  mushaf_style TEXT DEFAULT 'flow',
  default_reciter TEXT,
  daily_goal_pages INTEGER DEFAULT 5,
  prevent_repeat_days INTEGER DEFAULT 14,
  default_reading_duration TEXT DEFAULT 'medium'
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ayah_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '⭐',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL,
  ayah_id INTEGER NOT NULL,
  FOREIGN KEY (collection_id) REFERENCES collections(id)
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ayah_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memorization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surah_id INTEGER NOT NULL,
  start_ayah INTEGER NOT NULL,
  end_ayah INTEGER NOT NULL,
  level TEXT DEFAULT 'new',
  last_review TEXT,
  review_count INTEGER DEFAULT 0,
  mistake_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  memorized_at TEXT,
  priority_score REAL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_memo_surah ON memorization(surah_id);

CREATE TABLE IF NOT EXISTS review_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  type TEXT DEFAULT 'review'
);

CREATE TABLE IF NOT EXISTS review_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  memorization_id INTEGER NOT NULL,
  result TEXT,
  mistakes INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES review_sessions(id)
);

CREATE TABLE IF NOT EXISTS reading_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ayah_start INTEGER,
  ayah_end INTEGER,
  started_at TEXT NOT NULL,
  duration INTEGER
);

CREATE TABLE IF NOT EXISTS last_position (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  ayah_id INTEGER,
  page INTEGER,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  target INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  progress INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS daily_wird (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL,
  completed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prayer_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  prayer TEXT NOT NULL,
  surah_id INTEGER NOT NULL,
  start_ayah INTEGER NOT NULL,
  end_ayah INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS prayer_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surah_id INTEGER NOT NULL,
  start_ayah INTEGER NOT NULL,
  end_ayah INTEGER NOT NULL,
  ayah_count INTEGER NOT NULL,
  word_count INTEGER,
  estimated_duration TEXT,
  length_category TEXT,
  topics TEXT,
  coherence_score REAL DEFAULT 0.5
);
CREATE INDEX IF NOT EXISTS idx_psug_surah ON prayer_suggestions(surah_id);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  unlocked_at TEXT
);
`;

export const DEFAULT_SETTINGS_SQL = `
INSERT OR IGNORE INTO user_settings (id) VALUES (1);
INSERT OR IGNORE INTO last_position (id) VALUES (1);
`;
