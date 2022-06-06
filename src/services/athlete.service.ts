import { MessageEmbed } from 'discord.js';
import { AthleteAccess } from "../models/athlete-access";
import { AthleteActivity } from "../models/athlete-activity";
import { MonthlyChartItem } from "../models/monthly-chart-item";
import { Activity } from '../models/activity';
import { MonthlyLeaderboardType } from "../server/leaderboards/monthly-leaderboard-type";
import * as AthleteAccessRepository from "../persistence/repositories/athlete-access.repository";
import * as AthleteActivityRepository from "../persistence/repositories/athlete-activity.repository";
import * as MonthlyActivityAggregateRepository from "../persistence/repositories/monthly-activity-aggregate.repository";
import { MonthlyStatisticsAggregate } from '../models/monthly-statistics-aggregate';
import { webhookClient } from '../discord/webhook';
import { getDistance, getTime, round, getFormattedPace, getCadence, getFormattedTime, getHeartRate, getPace, getSpeed } from '../util/sport-maths';

const ALLOWED_ACTIVITY_TYPES = process.env.ALLOWED_ACTIVITY_TYPES?.split(',') || [];

export async function getAthleteAccess(athleteId: number): Promise<AthleteAccess> {
  const athleteAccesses = AthleteAccessRepository.get(athleteId);

  return athleteAccesses;
}

export async function getAllAthleteAccesses(): Promise<AthleteAccess[]> {
  const athleteAccesses = AthleteAccessRepository.getAll();

  return athleteAccesses;
}

export async function saveAthleteAccess(athleteAccess: AthleteAccess): Promise<void> {
  await AthleteAccessRepository.saveOrUpdate(athleteAccess);
}

export async function getAthleteActivity(activityId: number): Promise<AthleteActivity> {
  const athleteActivity = await AthleteActivityRepository.get(activityId);

  return athleteActivity;
}

export async function saveAthleteActivity(athleteAccess: AthleteAccess, activity: Activity): Promise<void> {
  const existingActivity = await AthleteActivityRepository.get(activity.id!);
  if (!existingActivity) {
    await AthleteActivityRepository.save({
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
      const activityMessage = getNewActivityMessage(athleteAccess, activity);

      webhookClient.send({
        embeds: [activityMessage]
      });
    }
  }
}

export async function processRankChanges(): Promise<void> {
  const previousAggregate = await getMonthlyStatisticsAggregate();

  await updateMonthlyAggregate();

  const currentAggregate = await getMonthlyStatisticsAggregate();

  for (let i = 0; i < currentAggregate.length; i++) {
    const current = currentAggregate[i];
    const previous = previousAggregate.find(prev => prev.athlete_id === current.athlete_id) || {
      athlete_id: current.athlete_id,
      distance_rank: Number.MAX_VALUE,
      time_rank: Number.MAX_VALUE,
      elevation_rank: Number.MAX_VALUE,
      pace_rank: Number.MAX_VALUE
    } as MonthlyStatisticsAggregate;

    Promise.all([
      notifyRankChange(current, previous, previousAggregate, 'distance_rank', getMessageFunction(MonthlyLeaderboardType.Distance)),
      notifyRankChange(current, previous, previousAggregate, 'time_rank', getMessageFunction(MonthlyLeaderboardType.MovingTime)),
      notifyRankChange(current, previous, previousAggregate, 'elevation_rank', getMessageFunction(MonthlyLeaderboardType.ElevationGain)),
      notifyRankChange(current, previous, previousAggregate, 'pace_rank', getMessageFunction(MonthlyLeaderboardType.Pace)),
    ]);
  }
}
  
export function getNewActivityMessage(athleteAccess: AthleteAccess, activity: Activity): MessageEmbed {
  const message = new MessageEmbed()
    .setTitle(`New *${activity.type}* activity!`)
    .setAuthor({
      name: getAthleteName(athleteAccess.athlete_firstname, athleteAccess.athlete_lastname),
      iconURL: athleteAccess.athlete_photo_url,
      url: getAthleteUrl(athleteAccess)
    })
    .setURL(getActivityUrl(activity)) 
    .setDescription(activity.name)
    .addField('Distance', getDistance(activity.distance)!, true)
    .addField('Time', getFormattedTime(activity.moving_time)!, true)
    .addField('Pace', getPace(activity.distance, activity.moving_time)!, true)
    .setImage(getStaticMapUrl(activity))
    .setFooter({
      text: `${activity.achievement_count} achievements gained`,
      iconURL: 'https://static-00.iconduck.com/assets.00/trophy-emoji-512x512-x32hyhlp.png'
    })
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

  return message;
}

export async function updateMonthlyAggregate(): Promise<void> {
  await MonthlyActivityAggregateRepository.update();
}

export async function getMonthlyStatisticsAggregate(date: Date = new Date()) {
  const monthlyStatisticsAggregate = await MonthlyActivityAggregateRepository.get(date);

  return monthlyStatisticsAggregate;
}

export async function getMonthlyChartAggregate(type: MonthlyLeaderboardType, date: Date = new Date()): Promise<MonthlyChartItem[]> {
  switch (type) {
    case MonthlyLeaderboardType.Distance:
      return await MonthlyActivityAggregateRepository.getMonthlyDistanceChartItems(date);
    case MonthlyLeaderboardType.MovingTime:
      return await MonthlyActivityAggregateRepository.getMonthlyMovingTimeChartItems(date);
    case MonthlyLeaderboardType.ElevationGain:
      return await MonthlyActivityAggregateRepository.getMonthlyElevationGainChartItems(date);
    case MonthlyLeaderboardType.Pace:
      return await MonthlyActivityAggregateRepository.getMonthlyPaceChartItems(date);
  }
}

async function notifyRankChange(
  current: MonthlyStatisticsAggregate, 
  previous: MonthlyStatisticsAggregate,
  previousAggregates: MonthlyStatisticsAggregate[],
  rankKey: keyof Pick<MonthlyStatisticsAggregate, 'distance_rank' | 'time_rank' | 'elevation_rank' | 'pace_rank'>,
  messageFmt: (athleteName: string, victims: string[], currentPlace: string, value: number) => string
): Promise<void> {
  if (current[rankKey] < previous[rankKey]) {
    const place = getPlace(current[rankKey]);
    const victims = previousAggregates
      .filter(x => x.athlete_id != current.athlete_id && current[rankKey] <= x[rankKey] && x[rankKey] < previous[rankKey])
      .map(x => getAthleteName(x.athlete_firstname, x.athlete_lastname));
    
    if (victims.length) {
      const athleteName = getAthleteName(current.athlete_firstname, current.athlete_lastname);
      const message = messageFmt(athleteName, victims, place, getValue(current, rankKey));

      await webhookClient.send(message);
    }
  }
}

function getValue(
  aggregate: MonthlyStatisticsAggregate,
  rankKey: keyof Pick<MonthlyStatisticsAggregate, 'distance_rank' | 'time_rank' | 'elevation_rank' | 'pace_rank'>
): number {
  switch (rankKey) {
    case 'distance_rank':
      return aggregate.total_distance;
    case 'time_rank':
      return aggregate.total_moving_time;
    case 'elevation_rank':
      return aggregate.total_elevation_gain;
    case 'pace_rank':
      return aggregate.avg_pace;
  }
}

function getMessageFunction(type: MonthlyLeaderboardType): (athleteName: string, victims: string[], currentPlace: string, value: number) => string {
  switch (type) {
    case MonthlyLeaderboardType.Distance:
      return (athlete, victims, place, value) =>  `**${athlete}** has overtaken ${victims.map(x => `*${x}*`).join(', ')} and is now in **${place}** place with a total distance of **${getDistance(value)}**!`;
    case MonthlyLeaderboardType.MovingTime:
      return (athlete, victims, place, value) => `**${athlete}** has overtaken ${victims.map(x => `*${x}*`).join(', ')} and is now in **${place}** place with a total moving time of **${getTime(value)}**!`;
    case MonthlyLeaderboardType.ElevationGain:
      return (athlete, victims, place, value) => `**${athlete}** has overtaken ${victims.map(x => `*${x}*`).join(', ')} and is now in **${place}** place with a total elevation gain of over ${round(value, 0)} meters!`;
    case MonthlyLeaderboardType.Pace:
      return (athlete, victims, place, value) => `**${athlete}** has overtaken ${victims.map(x => `*${x}*`).join(', ')} and is now in **${place}** place with a total pace of ${getFormattedPace(value)}!`;
  }
}

function getPlace(place: number) {
  return place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : `${place}th`;
}
  
function getAthleteName(firstname: string, lastname: string | undefined) {
  return lastname
    ? `${firstname} ${lastname}`
    : firstname;
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