import 'dotenv/config';
import { getWorkerLogger } from '../logging';
import { initializeDatabase } from '../persistence/migration-runner';
import { startJobs } from '../workflows/job-controller';

const logger = getWorkerLogger();

(async function () {
  await initializeDatabase(logger);
  await startJobs(logger);
})();
