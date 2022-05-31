CREATE TABLE IF NOT EXISTS athlete_access (
  id SERIAL PRIMARY KEY,
  athlete_id BIGINT NOT NULL,
  athlete_firstname TEXT NOT NULL,
  athlete_lastname TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at INT NOT NULL
);