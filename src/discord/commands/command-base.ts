import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export abstract class CommandBase {
  abstract getName(): string;
  abstract getDescription(): string;

  getData(): SlashCommandBuilder {
    return new SlashCommandBuilder()
      .setName(this.getName())
      .setDescription(this.getDescription());
  }

  canHandle(interaction: CommandInteraction): boolean {
    return interaction.commandName === this.getName();
  }
  
  abstract handle(interaction: CommandInteraction): Promise<void>;
}