import Router from '@koa/router';
import { addOAuthRoutes } from './strava';
import { addHealthRoutes } from './health';
import { addLeaderboardRoutes } from './leaderboards';
import { addSubscriptionRoutes } from './strava/subscription';

const router = new Router();

addOAuthRoutes(router);
addSubscriptionRoutes(router);
addHealthRoutes(router);
addLeaderboardRoutes(router);

export { router };
