import puppeteer from 'puppeteer';
import { AttachmentBuilder, ChatInputCommandInteraction, CommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandBase, CommandData } from './command-base';
import { getLongMonth } from '../../util/date';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Logger } from 'winston';
import { MonthlyLeaderboardType, MonthlyLeaderboardTypeFmt } from '../../models/monthly-leaderboard-type';

const URL = process.env.APP_URL || 'http://localhost:3000';

export class LeaderboardCommand extends CommandBase {
  getName(): string {
    return 'leaderboard'
  }

  getDescription(): string {
    return `Get the leaderboard of an ongoing month's activities`;
  }
  
  getData(): CommandData {
    return new SlashCommandBuilder()
      .setName(this.getName())
      .setDescription(this.getDescription())
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Type of leaderboard to return')
          .setRequired(true)
          .addChoices(
            { name: 'Distance', value: MonthlyLeaderboardTypeFmt.toSlug(MonthlyLeaderboardType.Distance) },
            { name: 'Time', value: MonthlyLeaderboardTypeFmt.toSlug(MonthlyLeaderboardType.MovingTime) },
            { name: 'Elevation Gain', value: MonthlyLeaderboardTypeFmt.toSlug(MonthlyLeaderboardType.ElevationGain) },
            { name: 'Pace', value: MonthlyLeaderboardTypeFmt.toSlug(MonthlyLeaderboardType.Pace) },
          ));
  }

  async handle(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    const leaderboardType = this.getLeaderboardType(interaction, logger);

    await interaction.deferReply();

    const buffers = await this.getLeaderboardBuffers(leaderboardType, logger);
    
    if (buffers.chart && buffers.leaderboard) {
      const [leaderboardAttachment, leaderboardEmbed] = this.getLeaderboard(buffers.leaderboard, leaderboardType);
      const [chartAttachment, chartEmbed] = this.getChart(buffers.chart, leaderboardType);

      await interaction.editReply({
        files: [leaderboardAttachment, chartAttachment],
        embeds: [leaderboardEmbed, chartEmbed]
      });
    } else {
      await interaction.editReply(`Failed to load leaderboard`);
    }
  }

  private getLeaderboardType(interaction: ChatInputCommandInteraction, logger: Logger): MonthlyLeaderboardType {
    const leaderboardType = interaction.options.getString('type', true);

    return MonthlyLeaderboardTypeFmt.fromSlug(leaderboardType);
  }

  private getLeaderboard(buffer: Buffer, leaderboardType: MonthlyLeaderboardType): [AttachmentBuilder, EmbedBuilder] {
    const attachmentName = 'leaderboard.png';
    const attachment = new AttachmentBuilder(buffer).setName(attachmentName);
    const title = `${MonthlyLeaderboardTypeFmt.toString(leaderboardType)} leaderboard for ${getLongMonth()}`;

    const leaderboardEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`Here's how the athletes are doing this month`)
      .setImage(`attachment://${attachmentName}`)
      .setURL(`${URL}/leaderboards/monthly/${leaderboardType}`)
      .setTimestamp();

    return [attachment, leaderboardEmbed];
  }

  private getChart(buffer: Buffer, leaderboardType: MonthlyLeaderboardType): [AttachmentBuilder, EmbedBuilder] {
    const attachmentName = 'chart.png';
    const attachment = new AttachmentBuilder(buffer).setName(attachmentName);
    const title = `${MonthlyLeaderboardTypeFmt.toString(leaderboardType)} over time for ${getLongMonth()}`;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`...and here's a neat chart of the leaderboard over time!`)
      .setImage(`attachment://${attachmentName}`)
      .setURL(`${URL}/leaderboards/monthly/${leaderboardType}/chart`)
      .setTimestamp();

    return [attachment, embed];
  }

  private async getLeaderboardBuffers(leaderboardType: MonthlyLeaderboardType, logger: Logger): Promise<{ leaderboard?: Buffer, chart?: Buffer }> {
    const buffers: { leaderboard?: Buffer, chart?: Buffer } = {};
    const typeSlug = MonthlyLeaderboardTypeFmt.toSlug(leaderboardType);

    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
  
      await page.goto(`${URL}/leaderboards/monthly/${typeSlug}/bare`);
      await page.waitForNetworkIdle({ idleTime: 100 });
      await page.waitForSelector('section.antialiased');
  
      const leaderboardElement = await page.$('section.antialiased');
      if (leaderboardElement) {
        buffers.leaderboard = (await leaderboardElement.screenshot({ omitBackground: true })) as Buffer;
      }
  
      await page.goto(`${URL}/leaderboards/monthly/${typeSlug}/chart`);
      await page.waitForNetworkIdle({ idleTime: 300 });
      await page.waitForSelector('canvas');
  
      const element = await page.$('canvas');
      if (element) {
        buffers.chart = (await element.screenshot()) as Buffer;
      }
  
      await browser.close();
    } catch (error) {
      logger.error(`Failed to get leaderboard buffers: ${error}`, { error });
    }

    return buffers;
  }
  
}
