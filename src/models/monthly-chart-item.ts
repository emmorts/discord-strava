export interface MonthlyChartItem {
  date: Date;
  athlete_id: number;
  athlete_firstname: string;
  athlete_lastname?: string;
  athlete_photo_url?: string;
  running_value: number;
}