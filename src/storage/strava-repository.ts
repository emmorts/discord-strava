import { AthleteAccess } from '../models/athlete-access';
import { AthleteActivity } from '../models/athlete-activity';
import { execute, query, queryAll } from './client';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { MonthlyStatisticsAggregate } from '../models/monthly-statistics-aggregate';

const MIGRATION_PATH = join(__dirname, 'migrations');

export async function initializeDatabase() {
  await execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL
    );`
  );

  const migrations = await getMigrations();
  
  for (let i = 0; i < migrations.length; i++) {
    await executeMigration(migrations[i]);
  }
}

export async function getMonthlyStatisticsAggregate(): Promise<MonthlyStatisticsAggregate[]> {
  return await queryAll<MonthlyStatisticsAggregate>(`
    SELECT
      SUM(act.distance) AS total_distance,
      SUM(act.moving_time) AS total_moving_time,
      SUM(act.total_elevation_gain) AS total_elevation_gain,
      acc.athlete_firstname AS athlete_firstname,
      acc.athlete_lastname AS athlete_lastname
    FROM athlete_activity act
    INNER JOIN athlete_access acc ON act.athlete_id = acc.athlete_id
    WHERE strftime('%m', act.start_date) = strftime('%m', date('now')) AND type = 'Run'
    GROUP BY act.athlete_id
    ORDER BY total_distance DESC;
  `);
}

export async function getAthleteActivity(activityId: number): Promise<AthleteActivity> {
  return await query<AthleteActivity>(`SELECT * FROM athlete_activity WHERE activity_id = ?`, [ activityId ]);
}

export async function saveAthleteActivity(athleteActivity: AthleteActivity) {
  await execute(`
    INSERT INTO athlete_activity (
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
    ) VALUES (
      $athleteId, 
      $activityId,
      $startDate,
      $utcOffset,
      $type,
      $distance,
      $movingTime,
      $elapsedTime,
      $elevHigh,
      $elevLow,
      $totalElevationGain,
      $averageSpeed,
      $maxSpeed,
      $averageCadence,
      $hasHeartrate,
      $averageHeartrate,
      $maxHeartrate,
      $kilojoules,
      $achievementCount
    )`, {
    $athleteId: athleteActivity.athlete_id,
    $activityId: athleteActivity.activity_id,
    $startDate: athleteActivity.start_date,
    $utcOffset: athleteActivity.utc_offset,
    $type: athleteActivity.type,
    $distance: athleteActivity.distance,
    $movingTime: athleteActivity.moving_time,
    $elapsedTime: athleteActivity.elapsed_time,
    $elevHigh: athleteActivity.elev_high,
    $elevLow: athleteActivity.elev_low,
    $totalElevationGain: athleteActivity.total_elevation_gain,
    $averageSpeed: athleteActivity.average_speed,
    $maxSpeed: athleteActivity.max_speed,
    $averageCadence: athleteActivity.average_cadence,
    $hasHeartrate: athleteActivity.has_heartrate,
    $averageHeartrate: athleteActivity.average_heartrate,
    $maxHeartrate: athleteActivity.max_heartrate,
    $kilojoules: athleteActivity.kilojoules,
    $achievementCount: athleteActivity.achievement_count
  });
}

export async function getAthleteAccess(atheleId: number): Promise<AthleteAccess> {
  return await query<AthleteAccess>(`SELECT * FROM athlete_access WHERE athlete_id = ?`, [ atheleId ]);
}

export async function getAllAthleteAccesses(): Promise<AthleteAccess[]> {
  return await queryAll<AthleteAccess>(`SELECT * FROM athlete_access`);
}

export async function saveAthleteAccess(athleteAccess: AthleteAccess) {
  const params = {
    $athleteId: athleteAccess.athlete_id,
    $accessToken: athleteAccess.access_token,
    $athleteFirstname: athleteAccess.athlete_firstname,
    $athleteLastname: athleteAccess.athlete_lastname,
    $refreshToken: athleteAccess.refresh_token,
    $expiresAt: athleteAccess.expires_at
  };

  if (athleteAccess.id) {
    await execute(`
      UPDATE athlete_access
      SET
        access_token = $accessToken,
        athlete_firstname = $athleteFirstname,
        athlete_lastname = $athleteLastname,
        refresh_token = $refreshToken,
        expires_at = $expiresAt
      WHERE athlete_id = $athleteId
    `, params);

    console.log(`Updated athlete access for athlete ${athleteAccess.athlete_id}`);
  } else {
    await execute(`
      INSERT INTO athlete_access (athlete_id, access_token, athlete_firstname, athlete_lastname, refresh_token, expires_at)
      VALUES ($athleteId, $accessToken, $athleteFirstname, $athleteLastname, $refreshToken, $expiresAt)
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
    
    await execute(`INSERT INTO migrations (filename) VALUES (?)`, migrationFilename);

    console.log(`Migration '${migrationFilename}' executed successfully`);
  } catch (error) {
    console.error(`Error executing migration '${migrationFilename}': ${error}`);
  }
}