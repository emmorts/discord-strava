import strava from 'strava-v3';
import { Athlete } from '../../models/athlete';
import { AthleteAccess } from '../../models/athlete-access';
import { getAllAthleteAccesses, saveAthleteAccess } from '../../storage/strava-repository';
import { JobBase } from './job-base';
import { JobOptions } from './job-options';

export class UpdateAthletePhotoJob extends JobBase {
  get options(): JobOptions {
    return {
      name: 'update-athlete-photo',
      schedule: '0 0 * * *',
      immediate: true
    };
  }

  async execute(): Promise<void> {
    const athleteAccesses = await getAllAthleteAccesses();

    if (athleteAccesses.length) {
      console.log(`Updating athlete photos...`);

      for (let athleteIndex = 0; athleteIndex < athleteAccesses.length; athleteIndex++) {
        await this.processAthlete(athleteAccesses[athleteIndex]);
      }

    } else {
      console.log(`No athletes found.`);
    }
  }

  private async processAthlete(athleteAccess: AthleteAccess): Promise<void> {
    await this.refreshToken(athleteAccess);

    let athlete = null;

    try {
      athlete = await this.getAthlete(athleteAccess);
    } catch (error) {
      console.log(`Failed to fetch athlete: ${error}`);

      return;
    }

    await this.updateAthletePhoto(athleteAccess, athlete);
  }

  private async getAthlete(athleteAccess: AthleteAccess): Promise<Athlete> {
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

  private async updateAthletePhoto(athleteAccess: AthleteAccess, athlete: Athlete) {
    if (athleteAccess.athlete_photo_url !== athlete.profile) {
      athleteAccess = {
        ...athleteAccess,
        athlete_photo_url: athlete.profile
      }

      await saveAthleteAccess(athleteAccess);
    }
  }

  private async refreshToken(athleteAccess: AthleteAccess) {
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
  
}