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
    .addField('Speed', getSpeed(activity), true)
    .addField('Heart Rate', getHeartRate(activity), true)
    .addField('Cadence', getCadence(activity), true)
    .setImage(getStaticMapUrl(activity))
    .setFooter(`${activity.achievement_count} achievements gained`, 'https://static-00.iconduck.com/assets.00/trophy-emoji-512x512-x32hyhlp.png')
    .setTimestamp();

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
  const totalHours = (~~(totalTime / 60)).toString().padStart(2, '0');
  const totalMinutes = (~~totalTime).toString().padStart(2, '0');
  const totalSeconds = Math.round(totalTime % 1 * 60).toString().padStart(2, '0');

  return totalHours === '00'
    ? `${totalMinutes}:${totalSeconds}`
    : `${totalHours}:${totalMinutes}:${totalSeconds}`;
}

function getPace(activity: Activity) {
  const paceTime = activity.moving_time * 1000 / 60 / activity.distance;
  const paceMinutes = ~~paceTime;
  const paceSeconds = Math.round(paceTime % 1 * 60);

  return `${paceMinutes}:${paceSeconds}`;
}

function getHeartRate(activity: Activity) {
  return activity.average_heartrate 
    ? `${activity.average_heartrate} bpm`
    : 'N/A';
}

function getCadence(activity: Activity) {
  return activity.average_cadence 
    ? `${activity.average_cadence * 2} spm`
    : 'N/A';
}

function getSpeed(activity: Activity) {
  return activity 
    ? `${Math.round(activity.average_speed * 3.6 * 100) / 100} km/h`
    : 'N/A';
}