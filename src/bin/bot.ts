import 'dotenv/config';
import { Client, Intents } from 'discord.js';
import { handleCommand, registerGuildCommands } from '../discord/command-controller';

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on('ready', async () => {
  const guilds = await client.guilds.fetch();
  
  for (let i = 0; i < guilds.size; i++) {
    const guild = guilds.at(i);

    if (guild) {
      await registerGuildCommands(guild);
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  await handleCommand(interaction);
});

client.login(process.env.DISCORD_BOT_TOKEN);