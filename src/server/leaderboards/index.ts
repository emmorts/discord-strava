import Router from '@koa/router';
import { sortByDistance, sortByElevationGain, sortByMovingTime, sortByPace } from '../../models/monthly-statistics-aggregate';
import { getMonthlyStatisticsAggregate } from '../../storage/strava-repository';
import { getLongMonth } from '../../util/date';
import { getDistance, getFormattedPace, getTime, round } from '../../util/sport-maths';
import { MonthlyLeaderboardType } from './monthly-leaderboard-type';

export function addLeaderboardRoutes(router: Router) {

  router.get('/leaderboards/monthly/:type', async ctx => {
    await ctx.render('leaderboards/monthly', {
      title: `Leaderboard for ${getLongMonth()}`,
      aggregates: await fetchMonthlyAggregates(getType(ctx.params))
    });
  });

  router.get('/leaderboards/monthly/:type/bare', async ctx => {
    await ctx.render('leaderboards/monthly.bare', {
      aggregates: await fetchMonthlyAggregates(getType(ctx.params))
    });
  });

}

function getType(params: Record<string, string>): MonthlyLeaderboardType {
  switch (params.type) {
    case 'distance':
    default:
      return MonthlyLeaderboardType.Distance;
    case 'elevation':
      return MonthlyLeaderboardType.ElevationGain;
    case 'pace':
      return MonthlyLeaderboardType.Pace;
    case 'time':
      return MonthlyLeaderboardType.MovingTime;
  }
}

async function fetchMonthlyAggregates(leaderboardType: MonthlyLeaderboardType) {
  const monthlyAggregates = await getMonthlyStatisticsAggregate();

  switch (leaderboardType) {
    case MonthlyLeaderboardType.Distance:
      monthlyAggregates.sort(sortByDistance);
      break;
    case MonthlyLeaderboardType.MovingTime:
      monthlyAggregates.sort(sortByMovingTime);
      break;
    case MonthlyLeaderboardType.ElevationGain:
      monthlyAggregates.sort(sortByElevationGain);
      break;
    case MonthlyLeaderboardType.Pace:
      monthlyAggregates.sort(sortByPace);
      break;
  }

  const formattedAggregates = monthlyAggregates.map(agg => ({
    athlete: agg.athlete_lastname ? `${agg.athlete_firstname} ${agg.athlete_lastname}` : agg.athlete_firstname,
    distance: getDistance(agg.total_distance) || 'N/A',
    time: getTime(agg.total_moving_time) || 'N/A',
    elevationGain: `${round(agg.total_elevation_gain, 0)} m`,
    pace: getFormattedPace(agg.avg_pace) || 'N/A'
  }));

  return formattedAggregates;
}
