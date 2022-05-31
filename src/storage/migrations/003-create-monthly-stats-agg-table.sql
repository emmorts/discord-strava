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