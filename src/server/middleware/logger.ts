import Koa from 'koa';

export function useLogger(app: Koa) {
  app.use(async (ctx, next) => {
    if (ctx.url === '/health') {
      await next();
      
      return;
    }
    const start = new Date().getTime();
    await next();
    const ms = new Date().getTime() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
  });
}