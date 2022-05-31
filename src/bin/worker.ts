import 'dotenv/config';
import { initializeDatabase, updateMonthlyAggregate } from '../storage/strava-repository';
import { startJobs } from '../workflows/job-controller';

(async function () {
  await initializeDatabase();
  await updateMonthlyAggregate();
  await startJobs();
})();
