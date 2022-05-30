import puppeteer from 'puppeteer';
import { CommandInteraction, MessageAttachment, MessageEmbed } from 'discord.js';
import { CommandBase } from './command-base';
import { getCurrentMonth } from '../../util/date';

const DOMAIN = process.env.APP_DOMAIN || 'http://localhost:3000';

export class StatsCommand extends CommandBase {
  getName(): string {
    return 'stats'
  }

  getDescription(): string {
    return `Get the leaderboard of an ongoing month's activities`;
  }

  async handle(interaction: CommandInteraction): Promise<void> {
    const leaderboardBuffer = await this.getLeaderboardBuffer();
    if (!leaderboardBuffer) {
      interaction.reply(`Failed to fetch leaderboards...`);

      return;
    }

    const fileName = 'leaderboard.png';
    const file = new MessageAttachment(leaderboardBuffer, fileName);

    const messageEmbed = new MessageEmbed()
      .setTitle(`Leaderboard for ${getCurrentMonth()}`)
      .setImage(`attachment://${fileName}`)
      .setURL(`${DOMAIN}/leaderboards/monthly`)
      .setTimestamp();

    interaction.reply({
      files: [file],
      embeds: [messageEmbed]
    });
    // const browser = await puppeteer.launch({
    //   args: ['--disable-dev-shm-usage'],
    // });
    // const page = await browser.newPage();

    // await page.goto(`${DOMAIN}/leaderboards/monthly/bare`);

    // await page.waitForSelector('section.antialiased');

    // const element = await page.$('section.antialiased');
    // if (element) {
    //   const buffer = await element.screenshot({ omitBackground: true });
    //   const fileName = 'leaderboard.png';
    //   const file = new MessageAttachment(buffer, fileName);

    //   const messageEmbed = new MessageEmbed()
    //     .setTitle(`Leaderboard for ${getCurrentMonth()}`)
    //     .setImage(`attachment://${fileName}`)
    //     .setURL(`${DOMAIN}/leaderboards/monthly`)
    //     .setTimestamp();

    //   interaction.reply({
    //     files: [file],
    //     embeds: [messageEmbed]
    //   });
    // }
  
    // await browser.close();
  }

  private async getLeaderboardBuffer(): Promise<Buffer | null> {
    let buffer: Buffer | null = null;

    const browser = await puppeteer.launch({
      args: ['--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();

    await page.goto(`${DOMAIN}/leaderboards/monthly/bare`);
    await page.waitForSelector('section.antialiased');

    const element = await page.$('section.antialiased');
    if (element) {
      buffer = (await element.screenshot({ omitBackground: true })) as Buffer;
    }

    await browser.close();

    return buffer;
  }
  
}
