import Router from '@koa/router';

export function addHealthRoutes(router: Router) {

    router.get('/', ctx => {
        ctx.status = 200;
    });

    router.get('/health', ctx => {
        ctx.status = 200;
    });

}