import Koa from 'koa';
import Router from '@koa/router';
import { useLogger } from './middleware/logger';
import { addOAuthRoutes } from './strava';
import { addHealthRoutes } from './health';

const app = new Koa();
const router = new Router();

useLogger(app);

addOAuthRoutes(router);
addHealthRoutes(router);

app
  .use(router.routes())
  .use(router.allowedMethods());

export default app;