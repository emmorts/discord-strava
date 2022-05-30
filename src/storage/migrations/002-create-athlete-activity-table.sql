CREATE TABLE IF NOT EXISTS athlete_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  athlete_id INTEGER NOT NULL,
  activity_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  utc_offset INTEGER NOT NULL,
  type TEXT NOT NULL,
  distance REAL,
  moving_time INTEGER,
  elapsed_time INTEGER,
  elev_high REAL,
  elev_low REAL,
  total_elevation_gain INTEGER,
  average_speed REAL,
  max_speed REAL,
  average_cadence REAL,
  has_heartrate BOOLEAN,
  average_heartrate REAL,
  max_heartrate REAL,
  kilojoules REAL,
  achievement_count INTEGER
);

SELECT
  SUM(act.distance) AS total_distance,
  SUM(act.moving_time) AS total_moving_time,
  SUM(act.total_elevation_gain) AS total_elevation_gain,
  acc.athlete_firstname AS athlete_firstname,
  acc.athlete_lastname AS athlete_lastname
FROM athlete_activity act
INNER JOIN athlete_access acc ON act.athlete_id = acc.athlete_id
WHERE strftime('%m', act.start_date) = strftime('%m', date('now')) AND type = 'Run'
GROUP BY act.athlete_id;