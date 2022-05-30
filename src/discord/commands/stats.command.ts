import puppeteer from 'puppeteer';
import { CommandInteraction } from 'discord.js';
import { CommandBase } from './command-base';

const DOMAIN = process.env.APP_DOMAIN || 'http://localhost:3000';

export class StatsCommand extends CommandBase {
  getName(): string {
    return 'stats'
  }

  getDescription(): string {
    return `Get the leaderboard of an ongoing month's activities`;
  }

  async handle(interaction: CommandInteraction): Promise<void> {
    const browser = await puppeteer.launch({
      args: ['--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();

    await page.goto(`${DOMAIN}/leaderboards/monthly/bare`);

    const buffer = await page.screenshot({ omitBackground: true });
  
    await browser.close();

    interaction.reply({
      files: [buffer],
      content: `${DOMAIN}/leaderboards/monthly`
    });
  }
  
}
