import strava from 'strava-v3';
import { MessageBuilder, Webhook } from 'discord-webhook-node';
import { Activity } from '../models/activity';
import { AthleteAccess } from '../models/athlete-access';
import { getDistance, getPace, getSpeed, getHeartRate, getCadence, getFormattedTime } from '../util/sport-maths';

const webHook = new Webhook(process.env.DISCORD_WEBHOOK_URL!);

export async function sendMessage(athleteAccess: AthleteAccess, activity: Activity) {
  const athleteName = getAthleteName(athleteAccess);
  const athletePhotoUrl = await getAthletePhotoUrl(athleteAccess);

  const message = new MessageBuilder()
    .setTitle(`New *${activity.type}* activity!`)
    .setAuthor(`${athleteName}`, athletePhotoUrl, getAthleteUrl(athleteAccess))
    // @ts-ignore
    .setURL(getActivityUrl(activity)) 
    .setDescription(activity.name)
    .addField('Distance', getDistance(activity.distance), true)
    .addField('Time', getFormattedTime(activity.moving_time), true)
    .addField('Pace', getPace(activity.distance, activity.moving_time), true)
    .setImage(getStaticMapUrl(activity))
    .setFooter(`${activity.achievement_count} achievements gained`, 'https://static-00.iconduck.com/assets.00/trophy-emoji-512x512-x32hyhlp.png')
    .setTimestamp();

  const speed = getSpeed(activity.average_speed);
  if (speed) {
    message.addField('Speed', speed, true)
  }

  const heartRate = getHeartRate(activity.average_heartrate);
  if (heartRate) {
    message.addField('Heart Rate', heartRate, true);
  }

  const cadence = getCadence(activity.average_cadence);
  if (cadence) {
    message.addField('Cadence', cadence, true);
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

function getActivityUrl(activity: Activity) {
  return `https://www.strava.com/activities/${activity.id}`;
}