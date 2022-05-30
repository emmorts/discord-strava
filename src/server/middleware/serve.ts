import Koa from 'koa';
import serve from 'koa-static';
import { resolve } from 'path';

export function useStaticAssets(app: Koa) {
    app.use(
        serve(resolve(__dirname, '../dist'))
    );
  }
  