import { Logger } from 'winston';
import { Athlete } from '../../models/athlete';
import { AthleteAccess } from '../../models/athlete-access';
import { getAllAthleteAccesses, saveAthleteAccess } from '../../services/athlete.service';
import { JobBase } from './job-base';
import { JobOptions } from './job-options';
import StravaService from '../../services/strava.service';

export class UpdateAthletePhotoJob extends JobBase {
  get options(): JobOptions {
    return {
      name: 'update-athlete-photo',
      schedule: '0 0 */10 * *',
      immediate: false
    };
  }

  async execute(logger: Logger): Promise<void> {
    const stravaService = new StravaService(logger);
    const athleteAccesses = await getAllAthleteAccesses();

    if (athleteAccesses.length) {
      logger.info(`Updating athlete photos...`);

      for (let athleteIndex = 0; athleteIndex < athleteAccesses.length; athleteIndex++) {
        await this.processAthlete(athleteAccesses[athleteIndex], stravaService, logger);
      }

    } else {
      logger.info(`No athletes found.`);
    }
  }

  private async processAthlete(athleteAccess: AthleteAccess, stravaService: StravaService, logger: Logger): Promise<void> {
    const athlete = await stravaService.getAthlete(athleteAccess);
    if (athlete) {
      await this.updateAthletePhoto(athleteAccess, athlete);
  
      logger.info(`Athlete's ${athleteAccess.athlete_id} photo has been updated`);
    } else {
      logger.warn(`Athlete ${athleteAccess.athlete_id} not found`);
    }
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
  
}