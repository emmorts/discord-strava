export interface AthleteAccess {
  id?: number;
  athlete_id: number;
  athlete_firstname: string;
  athlete_lastname?: string;
  athlete_photo_url?: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  discord_id?: string;
}