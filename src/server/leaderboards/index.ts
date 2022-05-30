import Router from '@koa/router';
import { getMonthlyStatisticsAggregate } from '../../storage/strava-repository';
import { getDistance, getPace, getTime, round } from '../../util/sport-maths';

export function addLeaderboardRoutes(router: Router) {

  router.get('/leaderboards/monthly', async ctx => {
    const locale = new Intl.DateTimeFormat('en-GB', { month: 'long' });
    const currentMonth = locale.format(new Date());
    const monthlyAggregates = await getMonthlyStatisticsAggregate();

    await ctx.render('leaderboards/monthly', {
      title: `Leaderboard for ${currentMonth}`,
      aggregates: monthlyAggregates.map(agg => ({
        athlete: agg.athlete_lastname ? `${agg.athlete_firstname} ${agg.athlete_lastname}` : agg.athlete_firstname,
        distance: getDistance(agg.total_distance) || 'N/A',
        time: getTime(agg.total_moving_time) || 'N/A',
        elevationGain: `${round(agg.total_elevation_gain, 0)} m`,
        pace: getPace(agg.total_distance, agg.total_moving_time) || 'N/A'
      }))
    });
  });

  router.get('/leaderboards/monthly/bare', async ctx => {
    const locale = new Intl.DateTimeFormat('en-GB', { month: 'long' });
    const currentMonth = locale.format(new Date());
    const monthlyAggregates = await getMonthlyStatisticsAggregate();

    await ctx.render('leaderboards/monthly.bare', {
      title: `Leaderboard for ${currentMonth}`,
      aggregates: monthlyAggregates.map(agg => ({
        athlete: agg.athlete_lastname ? `${agg.athlete_firstname} ${agg.athlete_lastname}` : agg.athlete_firstname,
        distance: getDistance(agg.total_distance) || 'N/A',
        time: getTime(agg.total_moving_time) || 'N/A',
        elevationGain: `${round(agg.total_elevation_gain, 0)} m`,
        pace: getPace(agg.total_distance, agg.total_moving_time) || 'N/A'
      }))
    });
  });

}