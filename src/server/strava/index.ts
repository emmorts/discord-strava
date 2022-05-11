import Router from '@koa/router';

import { default as strava } from 'strava-v3';
import { getAthleteAccess, saveAthleteAccess } from '../../storage/strava-repository';

export function addOAuthRoutes(router: Router) {
  
  router.get('/auth/strava', async ctx => {
    const requestAccessUrl = await strava.oauth.getRequestAccessURL({ scope: 'activity:read_all' });

    ctx.redirect(requestAccessUrl);
  });

  router.get('/auth/strava/callback', async ctx => {
    const payload = await strava.oauth.getToken(ctx.query.code as string);
    const existingAthlete = await getAthleteAccess(payload.athlete.id);

    saveAthleteAccess({
      id: existingAthlete?.id,
      athlete_id: payload.athlete.id,
      athlete_firstname: payload.athlete.firstname,
      athlete_lastname: payload.athlete.lastname,
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_at: payload.expires_at
    });

    ctx.redirect(`/auth/strava/success`);
  });

  router.get('/auth/strava/success', async ctx => {
    ctx.body = `Successfully authenticated athlete! You can close this window now.`;
    ctx.status = 200;
  });

}