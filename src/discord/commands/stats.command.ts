import { CommandInteraction } from 'discord.js';
import { MonthlyStatisticsAggregate } from '../../models/monthly-statistics-aggregate';
import { getMonthlyStatisticsAggregate } from '../../storage/strava-repository';
import { table } from 'table';
import { CommandBase } from './command-base';

export class StatsCommand extends CommandBase {
  getName(): string {
    return 'stats'
  }

  getDescription(): string {
    return `Get the leaderboard of an ongoing month's activities`;
  }

  async handle(interaction: CommandInteraction): Promise<void> {
    const monthlyAggregates = await getMonthlyStatisticsAggregate();

    await interaction.reply(gnerateMessage(monthlyAggregates));
  }
  
}

function gnerateMessage(aggregates: MonthlyStatisticsAggregate[]) {
  const locale = new Intl.DateTimeFormat('en-GB', { month: 'long' });
  const currentMonth = locale.format(new Date());

  return `
**Leaderboard for ${currentMonth}**
\`\`\`
${table(toTable(aggregates))}
\`\`\`
  `;
}

function toTable(aggregates: MonthlyStatisticsAggregate[]) {
  const table = [
    ['Athlete', 'Distance', 'Time', 'Elevation Gain']
  ];

  for (const aggregate of aggregates) {
    table.push([
      `${aggregate.athlete_firstname} ${aggregate.athlete_lastname}`,
      `${Math.round(aggregate.total_distance / 1000 * 100) / 100} km`,
      `${Math.round(aggregate.total_moving_time / 36) / 100} h`,
      `${aggregate.total_elevation_gain} m`,
    ]);
  }

  return table;
}