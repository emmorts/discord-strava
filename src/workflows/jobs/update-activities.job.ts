import strava from 'strava-v3';
import { sendMessage } from '../../discord/webhook';
import { Activity } from '../../models/activity';
import { AthleteAccess } from '../../models/athlete-access';
import { getAllAthleteAccesses, getAthleteActivity, saveAthleteAccess, saveAthleteActivity, updateMonthlyAggregate } from '../../storage/strava-repository';
import { JobBase } from './job-base';
import { JobOptions } from './job-options';

const DAY = 3600 * 24;
const ALLOWED_ACTIVITY_TYPES = process.env.ALLOWED_ACTIVITY_TYPES?.split(',') || [];

export class UpdateActivitiesJob extends JobBase {
  get options(): JobOptions {
    return {
      name: 'update-activities',
      schedule: process.env.SCHEDULE || '*/10 5-23 * * *',
      immediate: true
    };
  }

  async execute(): Promise<void> {
    const athleteAccesses = await getAllAthleteAccesses();

    if (athleteAccesses.length) {
      console.log(`Checking for new activities...`);

      let newActivities = 0;

      for (let athleteIndex = 0; athleteIndex < athleteAccesses.length; athleteIndex++) {
        newActivities += await this.processAthlete(athleteAccesses[athleteIndex]);
      }

      if (newActivities > 0) {
        updateMonthlyAggregate();
      }
    } else {
      console.log(`No athletes found.`);
    }
  }

  private async processAthlete(athleteAccess: AthleteAccess): Promise<number> {
    await this.refreshToken(athleteAccess);

    let activities: Activity[] = [];

    try {
      activities = await this.getActivities(athleteAccess);
    } catch (err) {
      console.error(JSON.stringify(err));

      return 0;
    }

    let newActivities = 0;

    for (let activityIndex = 0; activityIndex < activities.length; activityIndex++) { 
      const isNew = await this.processAthleteActivity(athleteAccess, activities[activityIndex]);
      if (isNew) {
        newActivities++;
      }
    }
    
    console.log(`[${athleteAccess.athlete_id}] ${activities.length} recent, ${newActivities} new`);

    return newActivities;
  }

  private async processAthleteActivity(athleteAccess: AthleteAccess, activity: Activity): Promise<boolean> {
    const existingActivity = await getAthleteActivity(activity.id);
    if (!existingActivity) {
      await saveAthleteActivity({
        athlete_id: athleteAccess.athlete_id,
        activity_id: activity.id,
        start_date: activity.start_date,
        utc_offset: activity.utc_offset,
        type: activity.type,
        distance: activity.distance,
        moving_time: activity.moving_time,
        elapsed_time: activity.elapsed_time,
        elev_high: activity.elev_high,
        elev_low: activity.elev_low,
        total_elevation_gain: activity.total_elevation_gain,
        average_speed: activity.average_speed,
        max_speed: activity.max_speed,
        average_cadence: activity.average_cadence,
        has_heartrate: activity.has_heartrate,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        kilojoules: activity.kilojoules,
        achievement_count: activity.achievement_count,
      });

      if (!ALLOWED_ACTIVITY_TYPES.length || ALLOWED_ACTIVITY_TYPES.includes(activity.type)) {
        await sendMessage(athleteAccess, activity);
      }

      return true;
    }

    return false;
  }

  private async getActivities(athleteAccess: AthleteAccess): Promise<Activity[]> {
    return new Promise((resolve, reject) => {
      const before = ~~(Date.now() / 1000);
      const after = before - DAY;
    
      strava.athlete.listActivities({
        'access_token': athleteAccess.access_token,
        before,
        after
      }, (err, payload) => {
        if (err) {
          reject(err);
        } else {
          resolve(payload);
        }
      });
    });
  }

  private async refreshToken(athleteAccess: AthleteAccess) {
    if (athleteAccess.expires_at < ~~(Date.now() / 1000)) {
      try {
        const refreshPayload = await strava.oauth.refreshToken(athleteAccess.refresh_token);

        athleteAccess.access_token = refreshPayload.access_token;
        athleteAccess.refresh_token = refreshPayload.refresh_token;
        athleteAccess.expires_at = refreshPayload.expires_at;
  
        await saveAthleteAccess(athleteAccess);

        console.log(`Refresh token for athlete ${athleteAccess.athlete_id} was updated`);
      } catch (error) {
        console.log(`Failed to fetch refresh token for athlete ${athleteAccess.athlete_id}: ${error}`);
      }
    }
  }
  
}