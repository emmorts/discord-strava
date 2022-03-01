import { AthleteAccess } from '../models/athlete-access';
import { AthleteActivity } from '../models/athlete-activity';
import { execute, query, queryAll } from './client';

export async function initializeDatabase() {
  await execute(`
    CREATE TABLE IF NOT EXISTS athlete_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      athlete_id INTEGER NOT NULL,
      athlete_firstname TEXT NOT NULL,
      athlete_lastname TEXT,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS athlete_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      athlete_id INTEGER NOT NULL,
      activity_id INTEGER NOT NULL
    );
  `);
}

export async function getAthleteActivity(activityId: number): Promise<AthleteActivity> {
  return await query<AthleteActivity>(`SELECT * FROM athlete_activity WHERE activity_id = ?`, [ activityId ]);
}

export async function saveAthleteActivity(athleteActivity: AthleteActivity) {
  await execute(`INSERT INTO athlete_activity (athlete_id, activity_id) VALUES ($athleteId, $activityId)`, {
    $athleteId: athleteActivity.athlete_id,
    $activityId: athleteActivity.activity_id
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