import 'dotenv/config';
import cron from 'node-cron';
import strava from 'strava-v3';
import { getAllAthleteAccesses, getAthleteActivity, initializeDatabase, saveAthleteAccess, saveAthleteActivity } from '../storage/strava-repository';
import { AthleteAccess } from '../models/athlete-access';
import { Activity } from '../models/activity';
import { sendMessage } from '../discord/webhook';

const DAY = 3600 * 24;
const SCHEDULE = process.env.SCHEDULE || '*/10 5-23 * * *';
const ALLOWED_ACTIVITY_TYPES = process.env.ALLOWED_ACTIVITY_TYPES?.split(',') || [];

(async function () {
  await initializeDatabase();
  await doWork();
})();

cron.schedule(SCHEDULE, async () => await doWork());

async function doWork() {
  const athleteAccesses = await getAllAthleteAccesses();

  if (athleteAccesses.length) {
    console.log(`Checking for new activities...`);

    for (let athleteIndex = 0; athleteIndex < athleteAccesses.length; athleteIndex++) {
      await processAthlete(athleteAccesses[athleteIndex]);
    }
  } else {
    console.log(`No athletes found.`);
  }
}

async function processAthlete(athleteAccess: AthleteAccess): Promise<void> {
  await refreshToken(athleteAccess);

  let activities: Activity[] = [];

  try {
    activities = await getActivities(athleteAccess);
  } catch (err) {
    console.error(JSON.stringify(err));

    return;
  }

  let newActivities = 0;

  for (let activityIndex = 0; activityIndex < activities.length; activityIndex++) { 
    const isNew = await processAthleteActivity(athleteAccess, activities[activityIndex]);
    if (isNew) {
      newActivities++;
    }
  }
  
  console.log(`[${athleteAccess.athlete_id}] ${activities.length} recent, ${newActivities} new`);
}

async function processAthleteActivity(athleteAccess: AthleteAccess, activity: Activity): Promise<boolean> {
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

async function getActivities(athleteAccess: AthleteAccess): Promise<Activity[]> {
  return new Promise((resolve, reject) => {
    const before = ~~(Date.now() / 1000);
    const after = before - DAY * 7;
  
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

async function refreshToken(athleteAccess: AthleteAccess) {
  if (athleteAccess.expires_at < ~~(Date.now() / 1000)) {
    const refreshPayload = await strava.oauth.refreshToken(athleteAccess.refresh_token);

    athleteAccess = {
      ...athleteAccess,
      access_token: refreshPayload.access_token,
      refresh_token: refreshPayload.refresh_token,
      expires_at: refreshPayload.expires_at
    }

    await saveAthleteAccess(athleteAccess);
  }
}
