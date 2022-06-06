import { AthleteActivity } from "../../models/athlete-activity";
import { execute, query } from "../client";

export async function get(activityId: number): Promise<AthleteActivity> {
  return await query<AthleteActivity>(`SELECT * FROM athlete_activity WHERE activity_id = $1`, [ activityId ]);
}

export async function save(athleteActivity: AthleteActivity) {
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