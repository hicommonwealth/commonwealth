import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';

let client: Client;

export async function getDiscordClient(): Promise<Client<true>> {
  if (client && client.isReady() && client.token) return client;

  if (!client) {
    client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });
  }

  return new Promise(async (resolve) => {
    if (client.isReady()) {
      resolve(client);
    } else {
      client.once('ready', () => {
        resolve(client as Client<true>);
      });
    }

    if (!client.token) {
      await client.login(config.DISCORD.BOT_TOKEN);
    }
  });
}
