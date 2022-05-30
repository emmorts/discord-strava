CREATE TABLE IF NOT EXISTS athlete_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  athlete_id INTEGER NOT NULL,
  athlete_firstname TEXT NOT NULL,
  athlete_lastname TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);