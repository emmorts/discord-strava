import puppeteer from 'puppeteer';
import { CommandInteraction, MessageAttachment, MessageEmbed } from 'discord.js';
import { CommandBase, CommandData } from './command-base';
import { getLongMonth } from '../../util/date';
import { SlashCommandBuilder } from '@discordjs/builders';

const URL = process.env.APP_URL || 'http://localhost:3000';

export class StatsCommand extends CommandBase {
  getName(): string {
    return 'stats'
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
            { name: 'Distance', value: 'distance' },
            { name: 'Time', value: 'time' },
            { name: 'Elevation Gain', value: 'elevation' },
            { name: 'Pace', value: 'pace' },
          ));
  }

  async handle(interaction: CommandInteraction): Promise<void> {
    const leaderboardType = interaction.options.getString('type', true);

    interaction.deferReply();

    const leaderboardBuffer = await this.getLeaderboardBuffer(leaderboardType);
    if (!leaderboardBuffer) {
      interaction.editReply(`Failed to fetch leaderboards...`);

      return;
    }
    const leaderboardAttachmentName = 'leaderboard.png';
    const leaderboardAttachment = new MessageAttachment(leaderboardBuffer, leaderboardAttachmentName);

    const chartBuffer = await this.getChartBuffer(leaderboardType);
    if (!chartBuffer) {
      interaction.editReply(`Failed to fetch chart...`);

      return;
    }
    const chartAttachmentName = 'chart.png';
    const chartAttachment = new MessageAttachment(chartBuffer, chartAttachmentName);

    const leaderboardEmbed = new MessageEmbed()
      .setTitle(`Leaderboard (${leaderboardType}) for ${getLongMonth()}`)
      .setDescription(`Here's how the athletes are doing this month`)
      .setImage(`attachment://${leaderboardAttachmentName}`)
      .setURL(`${URL}/leaderboards/monthly/${leaderboardType}`)
      .setTimestamp();

    const chartEmbed = new MessageEmbed()
      .setTitle(`Chart (${leaderboardType}) for ${getLongMonth()}`)
      .setDescription(`...and here's a neat chart of the leaderboard over time!`)
      .setImage(`attachment://${chartAttachmentName}`)
      .setURL(`${URL}/leaderboards/monthly/${leaderboardType}/chart`)
      .setTimestamp();

    interaction.editReply({
      files: [leaderboardAttachment, chartAttachment],
      embeds: [leaderboardEmbed, chartEmbed]
    });
  }

  private async getLeaderboardBuffer(leaderboardType: string): Promise<Buffer | null> {
    let buffer: Buffer | null = null;

    const browser = await puppeteer.launch({
      args: ['--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();

    await page.goto(`${URL}/leaderboards/monthly/${leaderboardType}/bare`);
    await page.waitForNetworkIdle({ idleTime: 100 });
    await page.waitForSelector('section.antialiased');

    const element = await page.$('section.antialiased');
    if (element) {
      buffer = (await element.screenshot({ omitBackground: true })) as Buffer;
    }

    await browser.close();

    return buffer;
  }

  private async getChartBuffer(leaderboardType: string): Promise<Buffer | null> {
    let buffer: Buffer | null = null;

    const browser = await puppeteer.launch({
      args: ['--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();

    await page.goto(`${URL}/leaderboards/monthly/${leaderboardType}/chart`);
    await page.waitForNetworkIdle({ idleTime: 100 });
    await page.waitForSelector('canvas');

    const element = await page.$('canvas');
    if (element) {
      buffer = (await element.screenshot()) as Buffer;
    }

    await browser.close();

    return buffer;
  }
  
}
