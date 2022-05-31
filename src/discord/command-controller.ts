import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { CommandInteraction, OAuth2Guild } from 'discord.js';
import { getCommandMap } from './commands';

const API_VERSION = process.env.DISCORD_API_VERSION || '10';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID;

const commandMap = getCommandMap();

export async function registerGuildCommands(guild: OAuth2Guild) {
  if (!CLIENT_ID) {
    console.error('DISCORD_BOT_CLIENT_ID is not set');
    return;
  }

  if (!guild) {
    console.error('guild is not set');
    return;
  }

  const rest = new REST({ version: API_VERSION }).setToken(BOT_TOKEN as string);
  const commands = Array.from(commandMap.values()).map(command => command.getData().toJSON());

	try {
		console.log(`Started refreshing application (/) commands on guild '${guild.name}'.`);

		await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), { body: commands });

		console.log(`Successfully reloaded application (/) commands on guild '${guild.name}'.`);
	} catch (error) {
		console.error(error);
	}
}

export async function handleCommand(interaction: CommandInteraction) {
  if (commandMap.has(interaction.commandName)) {
    const command = commandMap.get(interaction.commandName);
    if (!command) {
      console.error(`Command '${interaction.commandName}' is not registered.`);

      return;
    }

    if (command.canHandle(interaction)) {
      await command.handle(interaction);
    }
  }
}