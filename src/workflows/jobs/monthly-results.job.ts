import { Logger } from 'winston';
import { subDays } from 'date-fns';
import { EmbedBuilder } from 'discord.js';
import { webhookClient } from '../../discord/webhook';
import { MonthlyStatisticsAggregate } from '../../models/monthly-statistics-aggregate';
import { getLongMonth } from '../../util/date';
import { getFormattedPace, round } from '../../util/sport-maths';
import { JobBase } from './job-base';
import { JobOptions } from './job-options';
import { getMonthlyStatisticsAggregate } from '../../services/athlete.service';

const URL = process.env.APP_URL || 'http://localhost:3000';

export class MonthlyResultsJob extends JobBase {
  get options(): JobOptions {
    return {
      name: 'monthly-results',
      schedule: '0 6 1 * *',
      immediate: false
    };
  }

  async execute(logger: Logger): Promise<void> {
    const yesterday = subDays(new Date(), 1);
    const monthlyAggregates = await getMonthlyStatisticsAggregate(yesterday);
    if (!monthlyAggregates.length) {
      return;
    }

    const message = this.formatMessage(monthlyAggregates);
    
    await webhookClient.send({
      embeds: [message]
    });
  }

  private formatMessage(aggregates: MonthlyStatisticsAggregate[]): EmbedBuilder {
    const topDistance = aggregates.find(x => x.distance_rank === 1)!;
    const topTime = aggregates.find(x => x.time_rank === 1)!;
    const topElevation = aggregates.find(x => x.elevation_rank === 1)!;
    const topPace = aggregates.find(x => x.pace_rank === 1)!;

    const messageEmbed = new EmbedBuilder()
      .setTitle(`Results for ${getLongMonth()} are in!`)
      .setDescription(`The month of ${getLongMonth()} concludes! Let's bask in the glory of the month's accomplishments!`)
      .addFields(
        { name: 'Most distance covered', value: this.getDistanceMessage(topDistance) },
        { name: 'Most time spent running', value: this.getTimeMessage(topTime) },
        { name: 'Most elevation gained', value: this.getElevationGainMessage(topElevation) },
        { name: 'Fastest pace', value: this.getPaceMessage(topPace) }
      )
      .setColor('#eb8514')
      .setThumbnail('https://i.imgur.com/7erm8RK.png')
      .setURL(`${URL}/leaderboards/monthly/distance`)
      .setTimestamp();

    return messageEmbed;
  }

  private getDistanceMessage(aggregate: MonthlyStatisticsAggregate): string {
    return `**${this.getAthleteName(aggregate)}** has covered over ${round(aggregate.total_distance / 1000, 0)} kilometers!`;
  }

  private getTimeMessage(aggregate: MonthlyStatisticsAggregate): string {
    return `**${this.getAthleteName(aggregate)}** has spent ${round(aggregate.total_moving_time / 3600, 0)} hours running!`;
  }

  private getElevationGainMessage(aggregate: MonthlyStatisticsAggregate): string {
    return `**${this.getAthleteName(aggregate)}** has gained ${round(aggregate.total_elevation_gain, 0)} meters of elevation!`;
  }

  private getPaceMessage(aggregate: MonthlyStatisticsAggregate): string {
    return `**${this.getAthleteName(aggregate)}** has had an average pace of ${getFormattedPace(aggregate.avg_pace)}!`;
  }

  private getAthleteName(aggregate: MonthlyStatisticsAggregate) {
    if (aggregate.athlete_lastname) {
      return `${aggregate.athlete_firstname} ${aggregate.athlete_lastname}`;
    }

    return aggregate.athlete_firstname;
  }
}