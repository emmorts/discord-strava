import cron from 'node-cron';
import { Logger } from 'winston';
import { formatNs, timeAsync } from '../util/timer-utils';
import { getJobs } from './jobs';

export async function startJobs(logger: Logger): Promise<void> {
  const jobs = getJobs();
  if (!jobs.length) {
    logger.warn(`No jobs have been configured.`);

    return;
  }

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];

    if (job.options.immediate) {
      logger.info(`Job '${job.options.name}' is set to immediate execution, executing...`)

      try {
        await timeAsync(() => job.execute(logger), (elapsed, result) => {
          logger.info(`Job '${job.options.name}' executed successfully in ${formatNs(elapsed)}`);
        });
      } catch (error) {
        logger.error(`Failed to execute job '${job.options.name}': ${error}`)
      }
    }

    cron.schedule(job.options.schedule, async () => {
      logger.info(`Cron job '${job.options.name}' executing...`);

      try {
        await timeAsync(() => job.execute(logger), (elapsed, result) => {
          logger.info(`Cron job '${job.options.name}' executed successfully in ${formatNs(elapsed)}`);
        });
      } catch (error) {
        logger.error(`Failed to execute cron job '${job.options.name}': ${error}`)
      }
    });
  }
}