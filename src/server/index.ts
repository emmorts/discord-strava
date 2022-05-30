import Koa from 'koa';
import Router from '@koa/router';
import { useLogger } from './middleware/logger';
import { addOAuthRoutes } from './strava';
import { addHealthRoutes } from './health';
import { addLeaderboardRoutes } from './leaderboards';
import { usePug } from './middleware/pug';
import { useStaticAssets } from './middleware/serve';

const app = new Koa();
const router = new Router();

useLogger(app);
useStaticAssets(app);
usePug(app);

addOAuthRoutes(router);
addHealthRoutes(router);
addLeaderboardRoutes(router);

app
  .use(router.routes())
  .use(router.allowedMethods());

export default app;