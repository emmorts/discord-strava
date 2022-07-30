import { ChatInputCommandInteraction } from "discord.js";
import { Logger } from "winston";
import { getAthleteAccessByDiscordId } from '../../services/athlete.service';
import { CommandBase } from "./command-base";

export class StatsCommand extends CommandBase {
  getName(): string {
    return 'stats'
  }

  getDescription(): string {
    return `Get information about your progress`;
  }
  
  async handle(interaction: ChatInputCommandInteraction, logger: Logger): Promise<void> {
    const athleteAccess = await getAthleteAccessByDiscordId(interaction.user.id);
    if (!athleteAccess) {
      await interaction.reply({
        content: 'You need to link your Strava account to use this command.',
        ephemeral: true
      });

      return;
    }

    await interaction.reply({
      content: `This is still a work in progress... you probably wanted \`/leaderboard\` anyway`,
      ephemeral: true
    });
  }
}