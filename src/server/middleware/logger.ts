import Koa from 'koa';
import { Logger } from 'winston';
import { getServerLogger } from '../../logging';

const serverLogger = getServerLogger();

declare module 'koa' {
  interface BaseContext {
    logger: Logger;
  }
}

export function useLogger(app: Koa) {
  app.use(async (ctx, next) => {
    ctx.logger = serverLogger;
    
    if (ctx.url === '/health') {
      await next();

      return;
    }
    
    const start = new Date().getTime();
    await next();
    const ms = new Date().getTime() - start;
    serverLogger.info(`${ctx.method} [${ctx.status}] ${ctx.url} - ${ms}ms`);
  });
}