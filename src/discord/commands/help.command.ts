import { CommandInteraction, CacheType } from "discord.js";
import { CommandBase } from "./command-base";

export class HelpCommand extends CommandBase {
  getName(): string {
    return 'help'
  }

  getDescription(): string {
    return `Get a list of possible commands`;
  }
  
  async handle(interaction: CommandInteraction<CacheType>): Promise<void> {
    await interaction.reply(`
The following commands are available:
\`/help\` - Get a list of possible commands
\`/stats\` - Get the leaderboard of an ongoing month's activities
`);
  }
}