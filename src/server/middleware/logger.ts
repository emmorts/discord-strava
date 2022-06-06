import Koa from 'koa';
import { getServerLogger } from '../../logging';

const serverLogger = getServerLogger();

export function useLogger(app: Koa) {
  app.use(async (ctx, next) => {
    if (ctx.url === '/health') {
      await next();

      return;
    }
    
    const start = new Date().getTime();
    await next();
    const ms = new Date().getTime() - start;
    serverLogger.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
  });
}