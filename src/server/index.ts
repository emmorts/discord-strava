import Koa from 'koa';
import Router from '@koa/router';
import { useLogger } from './middleware/logger';
import { addOAuthRoutes } from './strava/oauth';

const app = new Koa();
const router = new Router();

useLogger(app);

addOAuthRoutes(router);

app
  .use(router.routes())
  .use(router.allowedMethods());

export default app;