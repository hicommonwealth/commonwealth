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

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Discord client connection timed out after 5 seconds'));
    }, 5_000); // 5 second timeout

    if (!client) {
      client = new Client({
        intents: [GatewayIntentBits.Guilds],
      });
      client.once('ready', () => {
        log.trace('Discord client ready');
        resolve(client as Client<true>);
      });
      client.once('error', (e) => {
        log.error('Discord client error');
        clearTimeout(timeout);
        reject(e);
      });
    }

    log.trace('Logging in to discord');
    client.login(config.DISCORD.BOT_TOKEN).catch((e) => {
      clearTimeout(timeout);
      reject(e);
    });
  });
}
