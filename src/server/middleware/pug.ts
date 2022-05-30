import Koa from 'koa';
import Pug from 'koa-pug';
import { resolve } from 'path';

export function usePug(app: Koa) {
  const pug = new Pug({
    viewPath: resolve(__dirname, '../views'),
    // locals: { /* variables and helpers */ },
    // basedir: 'path/for/pug/extends',
    // helperPath: [
    //   'path/to/pug/helpers',
    //   { random: 'path/to/lib/random.js' },
    //   { _: require('lodash') }
    // ],
    app: app // Binding `ctx.render()`, equals to pug.use(app)
  });
}
