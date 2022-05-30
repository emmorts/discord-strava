export interface AthleteActivity {
  id?: number;
  athlete_id: number;
  activity_id: number;
  start_date: string;
  utc_offset: number;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elev_high: number;
  elev_low: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_cadence: number;
  has_heartrate: boolean;
  average_heartrate: number;
  max_heartrate: number;
  kilojoules: number;
  achievement_count: number;
}