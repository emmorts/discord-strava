import 'dotenv/config';
import cron from 'node-cron';
import strava from 'strava-v3';
import { getAllAthleteAccesses, getAthleteActivity, initializeDatabase, saveAthleteAccess, saveAthleteActivity } from '../storage/strava-repository';
import { AthleteAccess } from '../models/athlete-access';
import { Activity } from '../models/activity';
import { sendMessage } from '../discord/webhook';

const DAY = 3600 * 24;
const SCHEDULE = process.env.SCHEDULE || '*/5 5-23 * * *';
const ALLOWED_ACTIVITY_TYPES = process.env.ALLOWED_ACTIVITY_TYPES?.split(',') || [];

(async function () {
  await initializeDatabase();
  await doWork();
})();

cron.schedule(SCHEDULE, async () => await doWork());

async function doWork() {
  console.log(`Checking for new activities...`);

  const athleteAccesses = await getAllAthleteAccesses();
  
  for (let athleteIndex = 0; athleteIndex < athleteAccesses.length; athleteIndex++) {
    await processAthlete(athleteAccesses[athleteIndex]);
  }
}

async function processAthlete(athleteAccess: AthleteAccess): Promise<void> {
  await refreshToken(athleteAccess);

  const activities = await getActivities(athleteAccess);

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
      activity_id: activity.id
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
