import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { formatISO } from 'date-fns';
import { AthleteAccess } from '../models/athlete-access';
import { AthleteActivity } from '../models/athlete-activity';
import { execute, query, queryAll } from './client';
import { MonthlyStatisticsAggregate } from '../models/monthly-statistics-aggregate';

const MIGRATION_PATH = join(__dirname, 'migrations');

export async function initializeDatabase() {
  await execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL
    );`
  );

  const migrations = await getMigrations();
  
  for (let i = 0; i < migrations.length; i++) {
    await executeMigration(migrations[i]);
  }
}

export async function updateMonthlyAggregate(): Promise<void> {
  await execute(`
    WITH monthly_stats_agg AS (
      SELECT
        date('now') AS timestamp,
        athlete_id,
        SUM(distance) AS total_distance,
        SUM(moving_time) AS total_moving_time,
        SUM(total_elevation_gain) AS total_elevation_gain,
        AVG((50 * moving_time) / (3 * distance)) AS avg_pace
      FROM athlete_activity
      WHERE type = 'Run'
        AND date_part('month', start_date::date) = date_part('month', CURRENT_DATE) 
        AND date_part('year', start_date::date) = date_part('year', CURRENT_DATE)
      GROUP BY athlete_id
    )
    INSERT INTO agg_monthly_stats(
      timestamp,
      athlete_id,
      total_distance,
      total_moving_time,
      total_elevation_gain,
      avg_pace,
      distance_rank,
      time_rank,
      elevation_rank,
      pace_rank)
    SELECT 
      timestamp,
      athlete_id,
      total_distance,
      total_moving_time,
      total_elevation_gain,
      avg_pace,
      RANK() OVER (ORDER BY total_distance DESC) AS distance_rank,
      RANK() OVER (ORDER BY total_moving_time DESC) AS time_rank,
      RANK() OVER (ORDER BY total_elevation_gain DESC) AS elevation_rank,
      RANK() OVER (ORDER BY avg_pace ASC) AS pace_rank
    FROM monthly_stats_agg
    WHERE true
    ON CONFLICT(timestamp, athlete_id) DO 
      UPDATE SET
        total_distance = excluded.total_distance,
        total_moving_time = excluded.total_moving_time,
        total_elevation_gain = excluded.total_elevation_gain,
        avg_pace = excluded.avg_pace,
        distance_rank = excluded.distance_rank,
        time_rank = excluded.time_rank,
        elevation_rank = excluded.elevation_rank,
        pace_rank = excluded.pace_rank;
  `);
}

export async function getMonthlyStatisticsAggregate(date: Date = new Date()): Promise<MonthlyStatisticsAggregate[]> {
  return await queryAll<MonthlyStatisticsAggregate>(`
    SELECT 
      agg.*,
      acc.athlete_firstname,
      acc.athlete_lastname,
      acc.athlete_photo_url
    FROM agg_monthly_stats agg
    INNER JOIN athlete_access AS acc ON agg.athlete_id = acc.athlete_id
    WHERE timestamp = (
      SELECT max(timestamp)
      FROM agg_monthly_stats
      WHERE date_part('month', timestamp::date) = date_part('month', $1::date)
    );
  `, [ formatISO(date, { representation: 'date' }) ]);
}

export async function getAthleteActivity(activityId: number): Promise<AthleteActivity> {
  return await query<AthleteActivity>(`SELECT * FROM athlete_activity WHERE activity_id = $1`, [ activityId ]);
}

export async function saveAthleteActivity(athleteActivity: AthleteActivity) {
  await execute(`
    INSERT INTO athlete_activity(
      athlete_id, 
      activity_id,
      start_date,
      utc_offset,
      type,
      distance,
      moving_time,
      elapsed_time,
      elev_high,
      elev_low,
      total_elevation_gain,
      average_speed,
      max_speed,
      average_cadence,
      has_heartrate,
      average_heartrate,
      max_heartrate,
      kilojoules,
      achievement_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19);`, [
      athleteActivity.athlete_id,
      athleteActivity.activity_id,
      athleteActivity.start_date,
      athleteActivity.utc_offset,
      athleteActivity.type,
      athleteActivity.distance,
      athleteActivity.moving_time,
      athleteActivity.elapsed_time,
      athleteActivity.elev_high,
      athleteActivity.elev_low,
      athleteActivity.total_elevation_gain,
      athleteActivity.average_speed,
      athleteActivity.max_speed,
      athleteActivity.average_cadence,
      athleteActivity.has_heartrate,
      athleteActivity.average_heartrate,
      athleteActivity.max_heartrate,
      athleteActivity.kilojoules,
      athleteActivity.achievement_count
    ]);
}

export async function getAthleteAccess(atheleId: number): Promise<AthleteAccess> {
  return await query<AthleteAccess>(`SELECT * FROM athlete_access WHERE athlete_id = ?`, [ atheleId ]);
}

export async function getAllAthleteAccesses(): Promise<AthleteAccess[]> {
  return await queryAll<AthleteAccess>(`SELECT * FROM athlete_access`);
}

export async function saveAthleteAccess(athleteAccess: AthleteAccess) {
  const params = [
    athleteAccess.athlete_id,
    athleteAccess.access_token,
    athleteAccess.athlete_firstname,
    athleteAccess.athlete_lastname,
    athleteAccess.athlete_photo_url,
    athleteAccess.refresh_token,
    athleteAccess.expires_at
  ];

  if (athleteAccess.id) {
    await execute(`
      UPDATE athlete_access
      SET
        access_token = $2,
        athlete_firstname = $3,
        athlete_lastname = $4,
        athlete_photo_url = $5,
        refresh_token = $6,
        expires_at = $7
      WHERE athlete_id = $1
    `, params);

    console.log(`Updated athlete access for athlete ${athleteAccess.athlete_id}`);
  } else {
    await execute(`
      INSERT INTO athlete_access (athlete_id, access_token, athlete_firstname, athlete_lastname, athlete_photo_url, refresh_token, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, params);

    console.log(`Saved athlete access for athlete ${athleteAccess.athlete_id}`);
  }
}

async function getAllMigrations(): Promise<string[]> {
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  const files = await readdir(MIGRATION_PATH);

  files.sort((a, b) => collator.compare(a, b));

  return files;
}

async function getExistingMigrations(): Promise<string[]> {
  const migrations = await queryAll<{ filename: string }>(`SELECT filename FROM migrations`);
  if (migrations) {
    return migrations.map(m => m.filename);
  }

  return [];
}

async function getMigrations() {
  const allMigrations = await getAllMigrations() || [];
  const existingMigrations = await getExistingMigrations() || [];

  return allMigrations.filter(migration => !existingMigrations.includes(migration));
}

async function executeMigration(migrationFilename: string): Promise<void> {
  const migrationPath = join(MIGRATION_PATH, migrationFilename);
  const migration = await readFile(migrationPath, 'utf-8');

  console.log(`Executing migration '${migrationFilename}'...`);

  try {
    await execute(migration);
    
    await execute(`INSERT INTO migrations (filename) VALUES ($1)`, [ migrationFilename ]);

    console.log(`Migration '${migrationFilename}' executed successfully`);
  } catch (error) {
    console.error(`Error executing migration '${migrationFilename}': ${error}`);
  }
}