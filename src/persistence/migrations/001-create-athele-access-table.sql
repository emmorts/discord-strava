CREATE TABLE IF NOT EXISTS athlete_access (
  id SERIAL PRIMARY KEY,
  athlete_id BIGINT NOT NULL,
  athlete_firstname TEXT NOT NULL,
  athlete_lastname TEXT,
  athlete_photo_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at INT NOT NULL
);

CREATE TABLE IF NOT EXISTS athlete_activity (
  id SERIAL PRIMARY KEY,
  athlete_id BIGINT NOT NULL,
  activity_id BIGINT NOT NULL,
  start_date TEXT NOT NULL,
  utc_offset INT NOT NULL,
  type TEXT NOT NULL,
  distance DECIMAL(12,4),
  moving_time INT,
  elapsed_time INT,
  elev_high DECIMAL(12,4),
  elev_low DECIMAL(12,4),
  total_elevation_gain INT,
  average_speed DECIMAL(12,4),
  max_speed DECIMAL(12,4),
  average_cadence DECIMAL(12,4),
  has_heartrate BOOLEAN,
  average_heartrate DECIMAL(12,4),
  max_heartrate DECIMAL(12,4),
  kilojoules DECIMAL(12,4),
  achievement_count INT
);

CREATE TABLE IF NOT EXISTS agg_monthly_stats (
  timestamp TEXT NOT NULL,
  athlete_id INTEGER NOT NULL,
  total_distance DECIMAL(12,4),
  total_moving_time DECIMAL(12,4),
  total_elevation_gain DECIMAL(12,4),
  avg_pace DECIMAL(12,4),
  distance_rank INTEGER NOT NULL,
  time_rank INTEGER NOT NULL,
  elevation_rank INTEGER NOT NULL,
  pace_rank INTEGER NOT NULL,

  PRIMARY KEY (timestamp, athlete_id)
);