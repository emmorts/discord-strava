import Koa from 'koa';
import { applyMiddleware } from './middleware';
import { router } from './routes';

const app = new Koa();

applyMiddleware(app);

app
  .use(router.routes())
  .use(router.allowedMethods());

export default app;