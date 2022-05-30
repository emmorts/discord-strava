import { CommandInteraction } from 'discord.js';
import { MonthlyStatisticsAggregate } from '../../models/monthly-statistics-aggregate';
import { getMonthlyStatisticsAggregate } from '../../storage/strava-repository';
import { table, TableUserConfig } from 'table';
import { CommandBase } from './command-base';
import { getDistance, getPace, getTime, round } from '../../util/sport-maths';

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

  const tableData = getTableData(aggregates);
  const tableConfig: TableUserConfig = {
    columns: [
      { alignment: 'center' },
      { alignment: 'left' },
      { alignment: 'right' },
      { alignment: 'right' },
      { alignment: 'right' },
      { alignment: 'right' }
    ]
  };

  return `
**Leaderboard for ${currentMonth}**
\`\`\`
${table(tableData, tableConfig)}
\`\`\`
  `;
}

function getTableData(aggregates: MonthlyStatisticsAggregate[]) {
  const table = [
    ['#', 'Athlete', 'Distance', 'Time', 'Elevation Gain', 'Average Pace']
  ];

  aggregates.forEach((aggregate, index) => {
    table.push([
      `#${index + 1}`,
      `${aggregate.athlete_firstname} ${aggregate.athlete_lastname}`,
      getDistance(aggregate.total_distance) || 'N/A',
      getTime(aggregate.total_moving_time) || 'N/A',
      `${round(aggregate.total_elevation_gain)} m`,
      getPace(aggregate.total_distance, aggregate.total_moving_time) || 'N/A'
    ]);
  });

  return table;
}