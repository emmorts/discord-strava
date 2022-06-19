import strava from 'strava-v3';
import { Logger } from 'winston';
import { Activity } from '../models/activity';
import { Athlete } from '../models/athlete';
import { AthleteAccess } from '../models/athlete-access';
import * as AthleteAccessRepository from "../persistence/repositories/athlete-access.repository";

const DAY = 3600 * 24;

export default class StravaService {
  constructor(private logger: Logger) {}

  async getActivities(athleteAccess: AthleteAccess, numberOfDays: number = 1): Promise<Activity[]> {
    await this.refreshToken(athleteAccess);
    
    let activities: Activity[] = [];

    try {
      activities = await this.getStravaActivities(athleteAccess, numberOfDays);
    } catch (error) {
      this.logger.error(`Failed to fetch activities: ${error}`, { error });
    }

    return activities;
  }

  async getActivity(athleteAccess: AthleteAccess, activityId: number): Promise<Activity> {
    await this.refreshToken(athleteAccess);
    
    let activity: Activity = null as unknown as any;

    try {
      activity = await this.getStravaActivity(athleteAccess, activityId);
    } catch (error) {
      this.logger.error(`Failed to fetch activity: ${error}`, { error });
    }

    return activity;
  }

  async getAthlete(athleteAccess: AthleteAccess): Promise<Athlete> {
    await this.refreshToken(athleteAccess);

    let athlete: Athlete = null as unknown as any;

    try {
      athlete = await this.getStravaAthlete(athleteAccess);
    } catch (error) {
      this.logger.error(`Failed to fetch athlete: ${error}`);
    }

    return athlete;
  }

  private async refreshToken(athleteAccess: AthleteAccess) {
    if (athleteAccess.expires_at > ~~(Date.now() / 1000)) {
      return;
    }

    try {
      const refreshPayload = await strava.oauth.refreshToken(athleteAccess.refresh_token);

      athleteAccess.access_token = refreshPayload.access_token;
      athleteAccess.refresh_token = refreshPayload.refresh_token;
      athleteAccess.expires_at = refreshPayload.expires_at;

      await AthleteAccessRepository.saveOrUpdate(athleteAccess);

      this.logger.info(`Refresh token for athlete ${athleteAccess.athlete_id} was updated`);
    } catch (error) {
      this.logger.error(`Failed to fetch refresh token for athlete ${athleteAccess.athlete_id}: ${error}`, { error });
    }
  }
  
  private async getStravaActivities(athleteAccess: AthleteAccess, numberOfDays: number = 1): Promise<Activity[]> {
    return new Promise((resolve, reject) => {
      const before = ~~(Date.now() / 1000);
      const after = before - DAY * numberOfDays;

      this.logger.info(`Retrieving athlete ${athleteAccess.athlete_id} activities for the last ${numberOfDays} days`)
    
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
  
  private async getStravaActivity(athleteAccess: AthleteAccess, activityId: number): Promise<Activity> {
    return new Promise((resolve, reject) => {
      strava.activities.get({
        'access_token': athleteAccess.access_token,
        id: activityId
      }, (err, payload) => {
        if (err) {
          reject(err);
        } else {
          resolve(payload);
        }
      });
    });
  }

  private async getStravaAthlete(athleteAccess: AthleteAccess): Promise<Athlete> {
    return new Promise((resolve, reject) => {
      strava.athlete.get({
        'access_token': athleteAccess.access_token
      }, (err, payload) => {
        if (err) {
          reject(err);
        } else {
          resolve(payload);
        }
      });
    });
  }
}