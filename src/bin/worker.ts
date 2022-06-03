import 'dotenv/config';
import { initializeDatabase } from '../storage/strava-repository';
import { startJobs } from '../workflows/job-controller';

(async function () {
  await initializeDatabase();
  await startJobs();
})();
