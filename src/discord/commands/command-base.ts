import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export type CommandData = Pick<SlashCommandBuilder, 'toJSON'>;

export abstract class CommandBase {
  abstract getName(): string;
  abstract getDescription(): string;

  getData(): CommandData {
    return new SlashCommandBuilder()
      .setName(this.getName())
      .setDescription(this.getDescription());
  }

  canHandle(interaction: CommandInteraction): boolean {
    return interaction.commandName === this.getName();
  }
  
  abstract handle(interaction: CommandInteraction): Promise<void>;
}