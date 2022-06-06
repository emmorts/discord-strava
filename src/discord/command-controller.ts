import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { CommandInteraction, OAuth2Guild } from 'discord.js';
import { getBotLogger } from '../logging';
import { formatNs, timeAsync } from '../util/timer-utils';
import { getCommandMap } from './commands';

const API_VERSION = process.env.DISCORD_API_VERSION || '10';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_BOT_CLIENT_ID;

const commandMap = getCommandMap();
const logger = getBotLogger();

export async function registerGuildCommands(guild: OAuth2Guild) {
  if (!CLIENT_ID) {
    logger.error('DISCORD_BOT_CLIENT_ID is not set');
    return;
  }

  if (!guild) {
    logger.error('guild is not set');
    return;
  }

  const rest = new REST({ version: API_VERSION }).setToken(BOT_TOKEN as string);
  const commands = Array.from(commandMap.values()).map(command => command.getData().toJSON());

	try {
		logger.info(`Started refreshing application (/) commands on guild '${guild.name}'.`);

		await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), { body: commands });

		logger.info(`Successfully reloaded application (/) commands on guild '${guild.name}'.`);
	} catch (error) {
		logger.error(`Failed to register commands on guild '${guild.name}': ${error}`, { error });
	}
}

export async function handleCommand(interaction: CommandInteraction) {
  if (commandMap.has(interaction.commandName)) {
    const command = commandMap.get(interaction.commandName);
    if (!command) {
      logger.error(`Command '${interaction.commandName}' is not registered.`);

      return;
    }

    if (command.canHandle(interaction)) {
      logger.info(`Command '${interaction.commandName}' is handling the interaction.`);

      try {
        await timeAsync(() => command.handle(interaction), (elapsed, result) => {
          logger.info(`Command '${interaction.commandName}' handled the interaction in ${formatNs(elapsed)}`);
        });
      } catch (error) {
        logger.error(`Failed to handle command '${interaction.commandName}': ${error}`, { error });
      }
    }
  }
}