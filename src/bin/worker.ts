import 'dotenv/config';
import cron from 'node-cron';
import strava from 'strava-v3';
import { getAllAthleteAccesses, getAthleteActivity, initializeDatabase, saveAthleteAccess, saveAthleteActivity } from '../storage/strava-repository';
import { AthleteAccess } from '../models/athlete-access';
import { Activity } from '../models/activity';
import { sendMessage } from '../discord/webhook';

const DAY = 3600 * 24;

initializeDatabase();

cron.schedule('*/5 * * * *', async () => {
  const athleteAccesses = await getAllAthleteAccesses();

  for (let athleteIndex = 0; athleteIndex < athleteAccesses.length; athleteIndex++) {
    await processAthlete(athleteAccesses[athleteIndex]);
  }
});

// (async function () {
//   const athleteAccesses = await getAllAthleteAccesses();
  
//   for (let athleteIndex = 0; athleteIndex < athleteAccesses.length; athleteIndex++) {
//     await processAthlete(athleteAccesses[athleteIndex]);
//   }
// })();

async function processAthlete(athleteAccess: AthleteAccess): Promise<void> {
  await refreshToken(athleteAccess);

  const activities = await getActivities(athleteAccess);

  for (let activityIndex = 0; activityIndex < activities.length; activityIndex++) { 
    await processAthleteActivity(athleteAccess, activities[activityIndex]);
  }
}

async function processAthleteActivity(athleteAccess: AthleteAccess, activity: Activity): Promise<void> {
  const existingActivity = await getAthleteActivity(activity.id);
  if (!existingActivity) {
    await saveAthleteActivity({
      athlete_id: athleteAccess.athlete_id,
      activity_id: activity.id
    });
    await sendMessage(athleteAccess, activity);
  }
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