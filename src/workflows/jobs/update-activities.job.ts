import { MessageEmbed } from 'discord.js';
import strava from 'strava-v3';
import { webhookClient } from '../../discord/webhook';
import { Activity } from '../../models/activity';
import { AthleteAccess } from '../../models/athlete-access';
import { getAllAthleteAccesses, getAthleteActivity, getMonthlyStatisticsAggregate, saveAthleteAccess, saveAthleteActivity, updateMonthlyAggregate } from '../../storage/strava-repository';
import { getCadence, getDistance, getFormattedPace, getFormattedTime, getHeartRate, getPace, getSpeed, getTime, round } from '../../util/sport-maths';
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
        console.log(`Updating aggregates...`);

        await this.updateAggregates();
      } else {
        console.log(`No new activities found.`);
      }
    } else {
      console.log(`No athletes found.`);
    }
  }

  private async updateAggregates() {
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
      }

      const athleteName = this.getAthleteName(current.athlete_firstname, current.athlete_lastname);

      if (current.distance_rank < previous.distance_rank) {
        const place = this.getPlace(current.distance_rank);
        const victims = previousAggregate
          .filter(x => x.athlete_id != current.athlete_id && x.distance_rank <= current.distance_rank)
          .map(x => this.getAthleteName(x.athlete_firstname, x.athlete_lastname));
        
        if (victims.length) {
          await webhookClient.send(`${athleteName} has overtaken ${victims.join(', ')} and is now in ${place} place with a total distance of ${getDistance(current.total_distance)}!`);
        }
      }

      if (current.time_rank < previous.time_rank) {
        const place = this.getPlace(current.time_rank);
        const victims = previousAggregate
          .filter(x => x.athlete_id != current.athlete_id && x.time_rank <= current.time_rank)
          .map(x => this.getAthleteName(x.athlete_firstname, x.athlete_lastname));
        
        if (victims.length) {
          await webhookClient.send(`${athleteName} has overtaken ${victims.join(', ')} and is now in ${place} place with a total moving time of ${getTime(current.total_moving_time)}!`);
        }
      }

      if (current.elevation_rank < previous.elevation_rank) {
        const place = this.getPlace(current.elevation_rank);
        const victims = previousAggregate
          .filter(x => x.athlete_id != current.athlete_id && x.elevation_rank <= current.elevation_rank)
          .map(x => this.getAthleteName(x.athlete_firstname, x.athlete_lastname));
        
        if (victims.length) {
          await webhookClient.send(`${athleteName} has overtaken ${victims.join(', ')} and is now in ${place} place with a total elevation gain of over ${round(current.total_elevation_gain, 0)} meters!`);
        }
      }

      if (current.pace_rank < previous.pace_rank) {
        const place = this.getPlace(current.pace_rank);
        const victims = previousAggregate
          .filter(x => x.athlete_id != current.athlete_id && x.pace_rank <= current.pace_rank)
          .map(x => this.getAthleteName(x.athlete_firstname, x.athlete_lastname));
        
        if (victims.length) {
          await webhookClient.send(`${athleteName} has overtaken ${victims.join(', ')} and is now in ${place} place with an average pace of ${getFormattedPace(current.avg_pace)}!`);
        }
      }
    }
  }

  private getPlace(place: number) {
    return place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : `${place}th`;
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
        // await sendMessage(athleteAccess, activity);
        const activityMessage = this.generateNewActivityMessage(athleteAccess, activity);

        webhookClient.send({
          embeds: [activityMessage]
        });
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
  
  private generateNewActivityMessage(athleteAccess: AthleteAccess, activity: Activity): MessageEmbed {
    const message = new MessageEmbed()
      .setTitle(`New *${activity.type}* activity!`)
      .setAuthor({
        name: this.getAthleteName(athleteAccess.athlete_firstname, athleteAccess.athlete_lastname),
        iconURL: athleteAccess.athlete_photo_url,
        url: this.getAthleteUrl(athleteAccess)
      })
      .setURL(this.getActivityUrl(activity)) 
      .setDescription(activity.name)
      .addField('Distance', getDistance(activity.distance)!, true)
      .addField('Time', getFormattedTime(activity.moving_time)!, true)
      .addField('Pace', getPace(activity.distance, activity.moving_time)!, true)
      .setImage(this.getStaticMapUrl(activity))
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
  
  private getAthleteName(firstname: string, lastname: string | undefined) {
    return lastname
      ? `${firstname} ${lastname}`
      : firstname;
  }
  
  private getStaticMapUrl(activity: Activity) {
    const host = 'api.mapbox.com';
    const path = 'styles/v1/mapbox/streets-v11/static'
    const encodedPolyline = encodeURIComponent(activity.map.summary_polyline);
    const queryParams = `access_token=${process.env.MAPBOX_API_KEY}`;
  
    return `https://${host}/${path}/path-3+f44-0.75(${encodedPolyline})/auto/500x300?${queryParams}`
  }
  
  private getAthleteUrl(athleteAccess: AthleteAccess) {
    return `https://www.strava.com/athletes/${athleteAccess.athlete_id}`;
  }
  
  private getActivityUrl(activity: Activity) {
    return `https://www.strava.com/activities/${activity.id}`;
  }
  
}
