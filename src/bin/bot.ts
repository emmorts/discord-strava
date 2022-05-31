import 'dotenv/config';
import { client } from '../discord/client';

client.login(process.env.DISCORD_BOT_TOKEN);