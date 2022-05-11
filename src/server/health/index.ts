import Router from '@koa/router';

export function addHealthRoutes(router: Router) {

    router.get('/health', ctx => {
        ctx.status = 200;
    });

}