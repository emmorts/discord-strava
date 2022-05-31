export interface MonthlyStatisticsAggregate {
  timestamp: string;
  athlete_id: number;
  athlete_firstname: string;
  athlete_lastname: string;
  athlete_photo_url: string;
  total_distance: number;
  total_moving_time: number;
  total_elevation_gain: number;
  avg_pace: number;
  distance_rank: number;
  time_rank: number;
  elevation_rank: number;
  pace_rank: number;
}

export function sortByDistance(aggregate: MonthlyStatisticsAggregate, otherAggregate: MonthlyStatisticsAggregate) {
  return aggregate.distance_rank - otherAggregate.distance_rank;
}

export function sortByMovingTime(aggregate: MonthlyStatisticsAggregate, otherAggregate: MonthlyStatisticsAggregate) {
  return aggregate.time_rank - otherAggregate.time_rank;
}

export function sortByElevationGain(aggregate: MonthlyStatisticsAggregate, otherAggregate: MonthlyStatisticsAggregate) {
  return aggregate.elevation_rank - otherAggregate.elevation_rank;
}

export function sortByPace(aggregate: MonthlyStatisticsAggregate, otherAggregate: MonthlyStatisticsAggregate) {
  return aggregate.pace_rank - otherAggregate.pace_rank;
}