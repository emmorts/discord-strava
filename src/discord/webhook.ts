import strava from 'strava-v3';
import { MessageBuilder, Webhook } from 'discord-webhook-node';
import { Activity } from '../models/activity';
import { AthleteAccess } from '../models/athlete-access';

const webHook = new Webhook(process.env.DISCORD_WEBHOOK_URL!);

export async function sendMessage(athleteAccess: AthleteAccess, activity: Activity) {
  const athleteName = getAthleteName(athleteAccess);
  const athletePhotoUrl = await getAthletePhotoUrl(athleteAccess);

  const message = new MessageBuilder()
    .setTitle(`New *${activity.type}* activity!`)
    .setAuthor(`${athleteName}`, athletePhotoUrl, getAthleteUrl(athleteAccess))
    // @ts-ignore
    .setURL(`https://www.strava.com/activities/${activity.id}`) 
    .setDescription(activity.name)
    .addField('Distance', getDistance(activity), true)
    .addField('Time', getTime(activity), true)
    .addField('Pace', getPace(activity), true)
    .setImage(getStaticMapUrl(activity))
    .setFooter(`${activity.achievement_count} achievements gained`, 'https://static-00.iconduck.com/assets.00/trophy-emoji-512x512-x32hyhlp.png')
    .setTimestamp();

  const speed = getSpeed(activity);
  if (speed) {
    message.addField('Speed', getSpeed(activity), true)
  }

  const heartRate = getHeartRate(activity);
  if (heartRate) {
    message.addField('Heart Rate', getHeartRate(activity), true);
  }

  const cadence = getCadence(activity);
  if (cadence) {
    message.addField('Cadence', getCadence(activity), true);
  }

  await webHook.send(message);
}

async function getAthletePhotoUrl(athleteAccess: AthleteAccess) {
  const athlete = await strava.athlete.get({ 'access_token': athleteAccess.access_token })

  return athlete.profile_medium;
}

function getAthleteName(athleteAccess: AthleteAccess) {
  return athleteAccess.athlete_lastname
    ? `${athleteAccess.athlete_firstname} ${athleteAccess.athlete_lastname}`
    : athleteAccess.athlete_firstname;
}

function getStaticMapUrl(activity: Activity) {
  const host = 'api.mapbox.com';
  const path = 'styles/v1/mapbox/streets-v11/static'
  const encodedPolyline = encodeURIComponent(activity.map.summary_polyline);
  const queryParams = `access_token=${process.env.MAPBOX_API_KEY}`;

  return `https://${host}/${path}/path-3+f44-0.75(${encodedPolyline})/auto/500x300?${queryParams}`
}

function getAthleteUrl(athleteAccess: AthleteAccess) {
  return `https://www.strava.com/athletes/${athleteAccess.athlete_id}`;
}

function getDistance(activity: Activity) {
  return activity 
    ? `${Math.round(activity.distance / 1000 * 100) / 100} km`
    : 'N/A';
}

function getTime(activity: Activity) {
  const totalTime = activity.moving_time / 60;
  const totalHours = (~~(totalTime / 60));
  const totalMinutes = (~~totalTime - totalHours * 60);
  const totalSeconds = Math.round(totalTime % 1 * 60);

  return totalHours === 0
    ? `${pad(totalMinutes)}:${pad(totalSeconds)}`
    : `${pad(totalHours)}:${pad(totalMinutes)}:${pad(totalSeconds)}`;
}

function getPace(activity: Activity) {
  const paceTime = activity.moving_time * 1000 / 60 / activity.distance;
  const paceMinutes = ~~paceTime;
  const paceSeconds = ~~(paceTime % 1 * 60);

  return `${paceMinutes}:${pad(paceSeconds)} /km`;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function getHeartRate(activity: Activity) {
  return activity.average_heartrate 
    ? `${activity.average_heartrate} bpm`
    : null;
}

function getCadence(activity: Activity) {
  return activity.average_cadence 
    ? `${activity.average_cadence * 2} spm`
    : null;
}

function getSpeed(activity: Activity) {
  return activity 
    ? `${Math.round(activity.average_speed * 3.6 * 100) / 100} km/h`
    : null;
}