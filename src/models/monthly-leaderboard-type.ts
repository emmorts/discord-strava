export enum MonthlyLeaderboardType {
  Distance,
  MovingTime,
  ElevationGain,
  Pace,
}

export class MonthlyLeaderboardTypeFmt {
  static toString(type: MonthlyLeaderboardType): string {
    switch (type) {
      case MonthlyLeaderboardType.Distance:
        return 'Distance';
      case MonthlyLeaderboardType.MovingTime:
        return 'Moving Time';
      case MonthlyLeaderboardType.ElevationGain:
        return 'Elevation Gain';
      case MonthlyLeaderboardType.Pace:
        return 'Pace';
    }
  }

  static toSlug(type: MonthlyLeaderboardType): string {
    switch (type) {
      case MonthlyLeaderboardType.Distance:
        return 'distance';
      case MonthlyLeaderboardType.MovingTime:
        return 'moving-time';
      case MonthlyLeaderboardType.ElevationGain:
        return 'elevation-gain';
      case MonthlyLeaderboardType.Pace:
        return 'pace';
    }
  }

  static fromSlug(value: string): MonthlyLeaderboardType {
    switch (value) {
      case 'distance':
        return MonthlyLeaderboardType.Distance;
      case 'moving-time':
        return MonthlyLeaderboardType.MovingTime;
      case 'elevation-gain':
        return MonthlyLeaderboardType.ElevationGain;
      case 'pace':
        return MonthlyLeaderboardType.Pace;
    }

    throw new Error(`Unknown leaderboard type: ${value}`);
  }
}