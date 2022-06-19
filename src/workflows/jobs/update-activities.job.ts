import { Logger } from 'winston';
import { Activity } from '../../models/activity';
import { AthleteAccess } from '../../models/athlete-access';
import { JobBase } from './job-base';
import { JobOptions } from './job-options';
import { getAllAthleteAccesses, getAthleteActivity, processRankChanges, saveAthleteActivity } from '../../services/athlete.service';
import StravaService from '../../services/strava.service';

export class UpdateActivitiesJob extends JobBase {
  get options(): JobOptions {
    return {
      name: 'update-activities',
      schedule: '0 0 */5 * *',
      immediate: true
    };
  }

  async execute(logger: Logger): Promise<void> {
    const stravaService = new StravaService(logger);
    const athleteAccesses = await getAllAthleteAccesses();

    if (athleteAccesses.length) {
      logger.info(`Checking for new activities...`);

      let newActivities = 0;

      for (let athleteIndex = 0; athleteIndex < athleteAccesses.length; athleteIndex++) {
        try {
          newActivities += await this.processAthlete(athleteAccesses[athleteIndex], stravaService, logger);
        } catch (error) {
          logger.error(`Failed to process athlete ${athleteAccesses[athleteIndex].athlete_id}: ${error}`, { error });
        }
      }

      if (newActivities > 0) {
        logger.info(`Updating aggregates...`);

        await processRankChanges();
      } else {
        logger.info(`No new activities found.`);
      }
    } else {
      logger.info(`No athletes found.`);
    }
  }

  private async processAthlete(athleteAccess: AthleteAccess, stravaService: StravaService, logger: Logger): Promise<number> {
    const activities = await stravaService.getActivities(athleteAccess, 10);

    let newActivities = 0;

    for (let activityIndex = 0; activityIndex < activities.length; activityIndex++) { 
      const isNew = await this.processAthleteActivity(athleteAccess, activities[activityIndex]);
      if (isNew) {
        newActivities++;
      }
    }
    
    logger.info(`[${athleteAccess.athlete_id}] ${activities.length} recent, ${newActivities} new`);

    return newActivities;
  }

  private async processAthleteActivity(athleteAccess: AthleteAccess, activity: Activity): Promise<boolean> {
    const existingActivity = await getAthleteActivity(activity.id);
    if (!existingActivity) {
      await saveAthleteActivity(athleteAccess, activity);

      return true;
    }

    return false;
  }
  
}
