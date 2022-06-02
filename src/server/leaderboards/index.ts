import Router from '@koa/router';
import { ChartConfiguration, ChartData, ChartDataset, DefaultDataPoint } from 'chart.js';
import { parse, add, setDate, isBefore, format } from 'date-fns';
import { MonthlyChartItem } from '../../models/monthly-chart-item';
import { sortByDistance, sortByElevationGain, sortByMovingTime, sortByPace } from '../../models/monthly-statistics-aggregate';
import { getMonthlyDistanceChartItems, getMonthlyElevationGainChartItems, getMonthlyMovingTimeChartItems, getMonthlyPaceChartItems, getMonthlyStatisticsAggregate } from '../../storage/strava-repository';
import { getBackgroundColor, getBorderColor } from '../../util/chart';
import { getLongMonth } from '../../util/date';
import { getDistance, getFormattedPace, getTime, round } from '../../util/sport-maths';
import { MonthlyLeaderboardType } from './monthly-leaderboard-type';

export function addLeaderboardRoutes(router: Router) {

  router.get('/leaderboards/monthly/:type', async ctx => {
    const date = getDate(ctx.query);
    const type = getType(ctx.params);

    await ctx.render('leaderboards/monthly', {
      title: `Leaderboard for ${getLongMonth(date)}`,
      aggregates: await fetchMonthlyAggregates(type, date)
    });
  });

  router.get('/leaderboards/monthly/:type/bare', async ctx => {
    const date = getDate(ctx.query);
    const type = getType(ctx.params);

    await ctx.render('leaderboards/monthly.bare', {
      aggregates: await fetchMonthlyAggregates(type, date)
    });
  });

  router.get('/leaderboards/monthly/:type/chart', async ctx => {
    const date = getDate(ctx.query);
    const type = getType(ctx.params);

    const chartData = await fetchMonthlyChartData(type, date);

    await ctx.render('leaderboards/monthly.chart', {
      data: JSON.stringify(chartData)
    });
  });

}

async function fetchMonthlyChartData(leaderboardType: MonthlyLeaderboardType, date: Date) {
  let chartItems: MonthlyChartItem[] = [];

  switch (leaderboardType) {
    case MonthlyLeaderboardType.Distance:
      chartItems = await getMonthlyDistanceChartItems(date);
      break;
    case MonthlyLeaderboardType.MovingTime:
      chartItems = await getMonthlyMovingTimeChartItems(date);
      break;
    case MonthlyLeaderboardType.ElevationGain:
      chartItems = await getMonthlyElevationGainChartItems(date);
      break;
    case MonthlyLeaderboardType.Pace:
      chartItems = await getMonthlyPaceChartItems(date);
      break;
  }
  
  return getChartConfiguration(leaderboardType, date, chartItems);
}

function getDaysOfMonth(date: Date) {
  const labels = [];

  let currentDate = setDate(date, 1);
  const nextMonth = add(currentDate, { months: 1 });
    
  while (isBefore(currentDate, nextMonth)) {
    labels.push(format(currentDate, 'yyyy-MM-dd'));

    currentDate = add(currentDate, { days: 1 });
  }

  return labels;
}

function getChartConfiguration(
  leaderboardType: MonthlyLeaderboardType, 
  date: Date, 
  chartItems: MonthlyChartItem[]
): ChartConfiguration<'line', DefaultDataPoint<'line'>> {
  const chartData = getChartData(leaderboardType, date, chartItems);
  const valueAxisTitle = getValueAxisTitle(leaderboardType);

  return {
    type: 'line',
    data: chartData,
    options: {
      animation: false,
      spanGaps: true,
      interaction: {
        mode: 'x'
      },
      scales: {
        x: {
          type: 'timeseries',
          time: {
            minUnit: 'day',
            stepSize: 5,
          }
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: valueAxisTitle
          },
          ticks: {
            precision: 0
          }
        }
      }
    }
  };
}

function getValueAxisTitle(leaderboardType: MonthlyLeaderboardType): string {
  switch (leaderboardType) {
    case MonthlyLeaderboardType.Distance:
      return 'Distance (km)';
    case MonthlyLeaderboardType.MovingTime:
      return 'Moving time (h)';
    case MonthlyLeaderboardType.ElevationGain:
      return 'Elevation gain (m)';
    case MonthlyLeaderboardType.Pace:
      return 'Pace /km';
  }
}

function getChartData(leaderboardType: MonthlyLeaderboardType, date: Date, chartItems: MonthlyChartItem[]): ChartData<'line', DefaultDataPoint<'line'>> {
  const dataSetMap = new Map<number, ChartDataset<'line', DefaultDataPoint<'line'>>>();

  const labels = getDaysOfMonth(date);
  const currentDateLabelIndex = labels.indexOf(format(new Date(), 'yyyy-MM-dd'));

  for (let i = 0; i < chartItems.length; i++) {
    const chartItem = chartItems[i];

    if (!dataSetMap.has(chartItem.athlete_id)) {
      dataSetMap.set(chartItem.athlete_id, {
        label: `${chartItem.athlete_firstname} ${chartItem.athlete_lastname}`,
        data: new Array(labels.length).fill(null),
        backgroundColor: getBackgroundColor(i),
        borderColor: getBorderColor(i),
        borderWidth: 1,
        pointRadius: 1,
        cubicInterpolationMode: 'monotone',
        // @ts-ignore
        imageUrl: chartItem.athlete_photo_url,
        fill: false
      });
    }

    const dateIndex = labels.indexOf(format(chartItem.date, 'yyyy-MM-dd'));
    if (dateIndex >= 0) {
      switch (leaderboardType) {
        case MonthlyLeaderboardType.Distance:
          dataSetMap.get(chartItem.athlete_id)!.data[dateIndex] = chartItem.running_value / 1000;
          break;
        case MonthlyLeaderboardType.MovingTime:
          dataSetMap.get(chartItem.athlete_id)!.data[dateIndex] = chartItem.running_value / 3600;
          break;
        case MonthlyLeaderboardType.ElevationGain:
        case MonthlyLeaderboardType.Pace:
          dataSetMap.get(chartItem.athlete_id)!.data[dateIndex] = chartItem.running_value;
          break;
      }
    }
  }

  return {
    labels,
    datasets: Array.from(dataSetMap.values()).map(x => postprocessDataset(x, currentDateLabelIndex))
  }
}

function postprocessDataset(dataset: ChartDataset<'line', DefaultDataPoint<'line'>>, currentDateLabelIndex: number): ChartDataset<'line', DefaultDataPoint<'line'>> {
  const lastIndex = currentDateLabelIndex === -1 ? dataset.data.length : currentDateLabelIndex;

  for (let i = 1; i < lastIndex; i++) {
    if (dataset.data[i] === null) {
      dataset.data[i] = dataset.data[i - 1];
    }
  }

  return dataset;
}

function getDate(query: Record<string, string | string[] | undefined>) {
  const currentDate = new Date();

  if (query.date) {
    const date = parse(query.date as string, 'yyyy-MM-dd', new Date());

    if (date) {
      return date;
    }
  }

  return currentDate;
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

async function fetchMonthlyAggregates(leaderboardType: MonthlyLeaderboardType, date: Date) {
  const monthlyAggregates = await getMonthlyStatisticsAggregate(date);

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
    athlete: {
      name: agg.athlete_lastname ? `${agg.athlete_firstname} ${agg.athlete_lastname}` : agg.athlete_firstname,
      photo: agg.athlete_photo_url
    },
    distance: getDistance(agg.total_distance) || 'N/A',
    time: getTime(agg.total_moving_time) || 'N/A',
    elevationGain: `${round(agg.total_elevation_gain, 0)} m`,
    pace: getFormattedPace(agg.avg_pace) || 'N/A'
  }));

  return formattedAggregates;
}
