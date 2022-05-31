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

    const leaderboardBuffer = await this.getLeaderboardBuffer(leaderboardType);
    if (!leaderboardBuffer) {
      interaction.reply(`Failed to fetch leaderboards...`);

      return;
    }

    const fileName = 'leaderboard.png';
    const file = new MessageAttachment(leaderboardBuffer, fileName);

    const messageEmbed = new MessageEmbed()
      .setTitle(`Leaderboard for ${getLongMonth()}`)
      .setImage(`attachment://${fileName}`)
      .setURL(`${URL}/leaderboards/monthly/${leaderboardType}`)
      .setTimestamp();

    interaction.reply({
      files: [file],
      embeds: [messageEmbed],
      ephemeral: true
    });
  }

  private async getLeaderboardBuffer(leaderboardType: string): Promise<Buffer | null> {
    let buffer: Buffer | null = null;

    const browser = await puppeteer.launch({
      args: ['--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();

    await page.goto(`${URL}/leaderboards/monthly/${leaderboardType}/bare`);
    await page.waitForSelector('section.antialiased');

    const element = await page.$('section.antialiased');
    if (element) {
      buffer = (await element.screenshot({ omitBackground: true })) as Buffer;
    }

    await browser.close();

    return buffer;
  }
  
}
