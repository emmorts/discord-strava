import 'dotenv/config';
import Server from '../server/index';
import { initializeDatabase } from '../storage/strava-repository';

const port = process.env.PORT || 3000;

initializeDatabase();

Server.listen(port);

console.log(`Server is running on port ${port}`);