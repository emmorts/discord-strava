import 'dotenv/config';
import { getServerLogger } from '../logging';
import Server from '../server/index';

const logger = getServerLogger();
const port = process.env.APP_PORT || 3000;

Server.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
