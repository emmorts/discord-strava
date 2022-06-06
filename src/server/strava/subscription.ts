import Router from '@koa/router';
import koaBody from 'koa-body';
import { default as strava } from 'strava-v3';
import { getAthleteAccess, processRankChanges, saveAthleteActivity } from '../../services/athlete.service';
import StravaService from '../../services/strava.service';

export function addSubscriptionRoutes(router: Router) {

  router.get('/api/strava/subscribe', async ctx => {
    try {
      await strava.pushSubscriptions.create({
        client_id: process.env.STRAVA_CLIENT_ID!,
        client_secret: process.env.STRAVA_CLIENT_SECRET!,
        callback_url: process.env.STRAVA_WEBHOOK_CALLBACK_URL!,
        verify_token: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN!,
      });
    } catch (error ) {
      ctx.logger.error(`Failed to create subscribtion: ${error}`, { error });
    }

    ctx.status = 200;
  });

  router.delete('/api/strava/subscribe', async ctx => {
    try {
      const existingSubscriptions = await strava.pushSubscriptions.list();

      if (existingSubscriptions.length) {
        await strava.pushSubscriptions.delete({
          client_id: process.env.STRAVA_CLIENT_ID!,
          client_secret: process.env.STRAVA_CLIENT_SECRET!,
          id: existingSubscriptions[0].id.toString(),
        });
      }
    } catch (error ) {
      ctx.logger.error(`Failed to delete subscribtion: ${error}`, { error });
    }

    ctx.status = 200;
  });

  router.get('/api/strava/event', async ctx => {
    if (ctx.query && ctx.query['hub.mode'] === 'subscribe' && ctx.query['hub.verify_token'] === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
      ctx.status = 200;
      ctx.body = {
        'hub.challenge': ctx.query['hub.challenge']
      };

      return;
    }

    ctx.status = 400;
  });

  router.post('/api/strava/event', koaBody(), async ctx => {
    if (ctx.request.body && ctx.request.body.object_type === 'activity' && ctx.request.body.aspect_type === 'create') {
      const stravaService = new StravaService(ctx.logger);

      const athleteAccess = await getAthleteAccess(ctx.request.body.owner_id);
      if (!athleteAccess) {
        ctx.logger.error(`Strava webhook received activity event for athlete ${ctx.request.body.owner_id} but no access token found`);
        ctx.status = 200;
        return;
      }

      const activity = await stravaService.getActivity(athleteAccess, ctx.request.body.object_id);
      if (!activity) {
        ctx.logger.error(`Strava webhook received activity event for activity ${ctx.request.body.object_id} but activity not found`);
        ctx.status = 200;
        return;
      }

      await saveAthleteActivity(athleteAccess, activity);
      await processRankChanges();
    }

    ctx.status = 200;
  });

}