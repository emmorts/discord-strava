import cron from 'node-cron';
import { getJobs } from './jobs';

export async function startJobs(): Promise<void> {
  const jobs = getJobs();
  if (!jobs.length) {
    console.log(`No jobs have been configured.`);

    return;
  }

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];

    if (job.options.immediate) {
      console.log(`Job '${job.options.name}' is set to immediate execution, executing...`)

      try {
        await job.execute();

        console.log(`Job '${job.options.name}' executed successfully`)
      } catch (error) {
        console.log(`Failed to execute job '${job.options.name}': ${error}`)
      }
    }

    cron.schedule(job.options.schedule, async () => await job.execute());
  }
}