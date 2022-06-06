import Koa from 'koa';
import { useLogger } from './logger';
import { usePug } from './pug';
import { useStaticAssets } from './serve';

export function applyMiddleware(app: Koa) {
  useLogger(app);
  useStaticAssets(app);
  usePug(app);
}