import puppeteer from 'puppeteer';
import { CommandInteraction, MessageAttachment, MessageEmbed, MessagePayload, WebhookEditMessageOptions } from 'discord.js';
import { CommandBase, CommandData } from './command-base';
import { getLongMonth } from '../../util/date';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Logger } from 'winston';

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

  async handle(interaction: CommandInteraction, logger: Logger): Promise<void> {
    const leaderboardType = interaction.options.getString('type', true);

    interaction.deferReply();

    const buffers = await this.getLeaderboardBuffers(leaderboardType, logger);
    if (buffers.chart && buffers.leaderboard) {
      const [leaderboardAttachment, leaderboardEmbed] = await this.getLeaderboard(buffers.leaderboard, leaderboardType, logger);
      const [chartAttachment, chartEmbed] = await this.getChart(buffers.chart, leaderboardType, logger);

      await interaction.editReply({
        files: [leaderboardAttachment, chartAttachment],
        embeds: [leaderboardEmbed, chartEmbed]
      });
    } else {
      await interaction.editReply(`Failed to load leaderboard`);
    }
  }

  private async getLeaderboard(buffer: Buffer, leaderboardType: string, logger: Logger): Promise<[MessageAttachment, MessageEmbed]> {
    const leaderboardAttachmentName = 'leaderboard.png';
    const leaderboardAttachment = new MessageAttachment(buffer, leaderboardAttachmentName);
    const leaderboardEmbed = new MessageEmbed()
      .setTitle(`Leaderboard (${leaderboardType}) for ${getLongMonth()}`)
      .setDescription(`Here's how the athletes are doing this month`)
      .setImage(`attachment://${leaderboardAttachmentName}`)
      .setURL(`${URL}/leaderboards/monthly/${leaderboardType}`)
      .setTimestamp();

    return [leaderboardAttachment, leaderboardEmbed];
  }

  private async getChart(buffer: Buffer, leaderboardType: string, logger: Logger): Promise<[MessageAttachment, MessageEmbed]> {
    const chartAttachmentName = 'chart.png';
    const chartAttachment = new MessageAttachment(buffer, chartAttachmentName);
    const chartEmbed = new MessageEmbed()
      .setTitle(`Chart (${leaderboardType}) for ${getLongMonth()}`)
      .setDescription(`...and here's a neat chart of the leaderboard over time!`)
      .setImage(`attachment://${chartAttachmentName}`)
      .setURL(`${URL}/leaderboards/monthly/${leaderboardType}/chart`)
      .setTimestamp();

    return [chartAttachment, chartEmbed];
  }

  private async getLeaderboardBuffers(leaderboardType: string, logger: Logger): Promise<{ leaderboard?: Buffer, chart?: Buffer }> {
    const buffers: { leaderboard?: Buffer, chart?: Buffer } = {};

    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
  
      await page.goto(`${URL}/leaderboards/monthly/${leaderboardType}/bare`);
      await page.waitForNetworkIdle({ idleTime: 100 });
      await page.waitForSelector('section.antialiased');
  
      const leaderboardElement = await page.$('section.antialiased');
      if (leaderboardElement) {
        buffers.leaderboard = (await leaderboardElement.screenshot({ omitBackground: true })) as Buffer;
      }
  
      await page.goto(`${URL}/leaderboards/monthly/${leaderboardType}/chart`);
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

  // private async getLeaderboardBuffer(leaderboardType: string, logger: Logger): Promise<Buffer | null> {
  //   let buffer: Buffer | null = null;

  //   try {
  //     const browser = await puppeteer.launch({
  //       args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  //     });
  //     const page = await browser.newPage();
  
  //     await page.goto(`${URL}/leaderboards/monthly/${leaderboardType}/bare`);
  //     await page.waitForNetworkIdle({ idleTime: 100 });
  //     await page.waitForSelector('section.antialiased');
  
  //     const element = await page.$('section.antialiased');
  //     if (element) {
  //       buffer = (await element.screenshot({ omitBackground: true })) as Buffer;
  //     }
  
  //     await browser.close();
  //   } catch (error) {
  //     logger.error(`Failed to get leaderboard buffer: ${error}`, { error });
  //   }

  //   return buffer;
  // }

  // private async getChartBuffer(leaderboardType: string, logger: Logger): Promise<Buffer | null> {
  //   let buffer: Buffer | null = null;

  //   try {
  //     const browser = await puppeteer.launch({
  //       args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  //     });
  //     const page = await browser.newPage();
  
  //     await page.goto(`${URL}/leaderboards/monthly/${leaderboardType}/chart`);
  //     await page.waitForNetworkIdle({ idleTime: 500 });
  //     await page.waitForSelector('canvas');
  
  //     const element = await page.$('canvas');
  //     if (element) {
  //       buffer = (await element.screenshot()) as Buffer;
  //     }
  
  //     await browser.close();
  //   } catch (error) {
  //     logger.error(`Failed to get leaderboard buffer: ${error}`, { error });
  //   }

  //   return buffer;
  // }
  
}
