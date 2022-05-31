CREATE TABLE IF NOT EXISTS agg_monthly_stats (
  timestamp TEXT NOT NULL,
  athlete_id INTEGER NOT NULL,
  total_distance INTEGER,
  total_moving_time INTEGER,
  total_elevation_gain INTEGER,
  avg_pace INTEGER,
  distance_rank INTEGER NOT NULL,
  time_rank INTEGER NOT NULL,
  elevation_rank INTEGER NOT NULL,
  pace_rank INTEGER NOT NULL,

  PRIMARY KEY (timestamp, athlete_id)
);