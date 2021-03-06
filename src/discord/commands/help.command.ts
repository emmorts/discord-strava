import { CommandInteraction } from "discord.js";
import { Logger } from "winston";
import { CommandBase } from "./command-base";

export class HelpCommand extends CommandBase {
  getName(): string {
    return 'help'
  }

  getDescription(): string {
    return `Get a list of possible commands`;
  }
  
  async handle(interaction: CommandInteraction, logger: Logger): Promise<void> {
    await interaction.reply(`
The following commands are available:
\`/help\` - Get a list of possible commands
\`/stats\` - Get your personal statistics
\`/leaderboard\` - Get the leaderboard of an ongoing month's activities
`);
  }
}