import { formatISO } from "date-fns";
import { MonthlyChartItem } from "../../models/monthly-chart-item";
import { MonthlyStatisticsAggregate } from "../../models/monthly-statistics-aggregate";
import { execute, queryAll } from "../client";

export async function update(): Promise<void> {
  await execute(`
    WITH monthly_stats_agg AS (
      SELECT
        date('now') AS timestamp,
        athlete_id,
        SUM(distance) AS total_distance,
        SUM(moving_time) AS total_moving_time,
        SUM(total_elevation_gain) AS total_elevation_gain,
        AVG((50 * moving_time) / (3 * distance)) AS avg_pace
      FROM athlete_activity
      WHERE type = 'Run'
        AND date_part('month', start_date::date) = date_part('month', CURRENT_DATE) 
        AND date_part('year', start_date::date) = date_part('year', CURRENT_DATE)
      GROUP BY athlete_id
    )
    INSERT INTO agg_monthly_stats(
      timestamp,
      athlete_id,
      total_distance,
      total_moving_time,
      total_elevation_gain,
      avg_pace,
      distance_rank,
      time_rank,
      elevation_rank,
      pace_rank)
    SELECT 
      timestamp,
      athlete_id,
      total_distance,
      total_moving_time,
      total_elevation_gain,
      avg_pace,
      RANK() OVER (ORDER BY total_distance DESC) AS distance_rank,
      RANK() OVER (ORDER BY total_moving_time DESC) AS time_rank,
      RANK() OVER (ORDER BY total_elevation_gain DESC) AS elevation_rank,
      RANK() OVER (ORDER BY avg_pace ASC) AS pace_rank
    FROM monthly_stats_agg
    WHERE true
    ON CONFLICT(timestamp, athlete_id) DO 
      UPDATE SET
        total_distance = excluded.total_distance,
        total_moving_time = excluded.total_moving_time,
        total_elevation_gain = excluded.total_elevation_gain,
        avg_pace = excluded.avg_pace,
        distance_rank = excluded.distance_rank,
        time_rank = excluded.time_rank,
        elevation_rank = excluded.elevation_rank,
        pace_rank = excluded.pace_rank;
  `);
}

export async function getMonthlyDistanceChartItems(date: Date): Promise<MonthlyChartItem[]> {
  return await queryAll<MonthlyChartItem>(`
      SELECT
      act.start_date::date AS date,
      act.athlete_id,
      aa.athlete_firstname,
      aa.athlete_lastname,
      aa.athlete_photo_url,
      SUM(act.distance) OVER (PARTITION BY act.athlete_id ORDER BY act.start_date) AS running_value
    FROM athlete_activity act
    JOIN athlete_access aa ON act.athlete_id = aa.athlete_id
    WHERE act.type = 'Run' 
      AND date_part('month', act.start_date::date) = date_part('month', $1::date)
      AND date_part('year', act.start_date::date) = date_part('year', $1::date)
    ORDER BY act.start_date
  `, [ formatISO(date, { representation: 'date' }) ]);
}

export async function getMonthlyMovingTimeChartItems(date: Date): Promise<MonthlyChartItem[]> {
  return await queryAll<MonthlyChartItem>(`
      SELECT
      act.start_date::date AS date,
      act.athlete_id,
      aa.athlete_firstname,
      aa.athlete_lastname,
      aa.athlete_photo_url,
      SUM(act.moving_time) OVER (PARTITION BY act.athlete_id ORDER BY act.start_date) AS running_value
    FROM athlete_activity act
    JOIN athlete_access aa ON act.athlete_id = aa.athlete_id
    WHERE act.type = 'Run' 
      AND date_part('month', act.start_date::date) = date_part('month', $1::date)
      AND date_part('year', act.start_date::date) = date_part('year', $1::date)
    ORDER BY act.start_date
  `, [ formatISO(date, { representation: 'date' }) ]);
}

export async function getMonthlyElevationGainChartItems(date: Date): Promise<MonthlyChartItem[]> {
  return await queryAll<MonthlyChartItem>(`
      SELECT
      act.start_date::date AS date,
      act.athlete_id,
      aa.athlete_firstname,
      aa.athlete_lastname,
      aa.athlete_photo_url,
      SUM(act.total_elevation_gain) OVER (PARTITION BY act.athlete_id ORDER BY act.start_date) AS running_value
    FROM athlete_activity act
    JOIN athlete_access aa ON act.athlete_id = aa.athlete_id
    WHERE act.type = 'Run' 
      AND date_part('month', act.start_date::date) = date_part('month', $1::date)
      AND date_part('year', act.start_date::date) = date_part('year', $1::date)
    ORDER BY act.start_date
  `, [ formatISO(date, { representation: 'date' }) ]);
}

export async function getMonthlyPaceChartItems(date: Date): Promise<MonthlyChartItem[]> {
  return await queryAll<MonthlyChartItem>(`
      SELECT
      act.start_date::date AS date,
      act.athlete_id,
      aa.athlete_firstname,
      aa.athlete_lastname,
      aa.athlete_photo_url,
      AVG((50 * moving_time) / (3 * distance)) OVER (PARTITION BY act.athlete_id ORDER BY act.start_date) AS running_value
    FROM athlete_activity act
    JOIN athlete_access aa ON act.athlete_id = aa.athlete_id
    WHERE act.type = 'Run' 
      AND date_part('month', act.start_date::date) = date_part('month', $1::date)
      AND date_part('year', act.start_date::date) = date_part('year', $1::date)
    ORDER BY act.start_date
  `, [ formatISO(date, { representation: 'date' }) ]);
}

export async function get(date: Date): Promise<MonthlyStatisticsAggregate[]> {
  return await queryAll<MonthlyStatisticsAggregate>(`
    SELECT 
      agg.*,
      acc.athlete_firstname,
      acc.athlete_lastname,
      acc.athlete_photo_url
    FROM agg_monthly_stats agg
    INNER JOIN athlete_access AS acc ON agg.athlete_id = acc.athlete_id
    WHERE timestamp = (
      SELECT max(timestamp)
      FROM agg_monthly_stats
      WHERE date_part('month', timestamp::date) = date_part('month', $1::date)
        AND date_part('year', timestamp::date) = date_part('year', $1::date)
    );
  `, [ formatISO(date, { representation: 'date' }) ]);
}