import Koa from 'koa';

export function useLogger(app: Koa) {
  app.use(async (ctx, next) => {
    const start = new Date().getTime();
    await next();
    const ms = new Date().getTime() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
  });
}