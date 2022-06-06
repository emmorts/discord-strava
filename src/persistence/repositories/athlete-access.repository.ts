import { AthleteAccess } from "../../models/athlete-access";
import { execute, query, queryAll } from "../client";

export async function get(atheleId: number): Promise<AthleteAccess> {
  return await query<AthleteAccess>(`SELECT * FROM athlete_access WHERE athlete_id = $1`, [ atheleId ]);
}

export async function getByDiscordId(discordId: string): Promise<AthleteAccess> {
  return await query<AthleteAccess>(`SELECT * FROM athlete_access WHERE discord_id = $1`, [ discordId ]);
}

export async function getAll(): Promise<AthleteAccess[]> {
  return await queryAll<AthleteAccess>(`SELECT * FROM athlete_access`);
}

export async function saveOrUpdate(athleteAccess: AthleteAccess) {
  const params = [
    athleteAccess.athlete_id,
    athleteAccess.access_token,
    athleteAccess.athlete_firstname,
    athleteAccess.athlete_lastname,
    athleteAccess.athlete_photo_url,
    athleteAccess.refresh_token,
    athleteAccess.expires_at,
    athleteAccess.discord_id,
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
        expires_at = $7,
        discord_id = $8
      WHERE athlete_id = $1
    `, params);

    console.log(`Updated athlete access for athlete ${athleteAccess.athlete_id}`);
  } else {
    console.log(params);
    await execute(`
      INSERT INTO athlete_access (athlete_id, access_token, athlete_firstname, athlete_lastname, athlete_photo_url, refresh_token, expires_at, discord_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, params);

    console.log(`Saved athlete access for athlete ${athleteAccess.athlete_id}`);
  }
}