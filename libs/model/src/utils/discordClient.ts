import { logger } from '@hicommonwealth/core';
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config';

const log = logger(import.meta);

let client: Client;

export async function getDiscordClient(): Promise<Client<true>> {
  if (client && client.isReady() && client.token) {
    log.trace('Using existing discord client');
    return client;
  }

  return new Promise((resolve) => {
    if (!client) {
      client = new Client({
        intents: [GatewayIntentBits.Guilds],
      });
      client.once('ready', () => {
        log.trace('Discord client ready');
        resolve(client as Client<true>);
      });
    }

    log.trace('Logging in to discord');
    client.login(config.DISCORD.BOT_TOKEN);
  });
}
