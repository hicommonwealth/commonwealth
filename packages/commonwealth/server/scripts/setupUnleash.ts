import { logger } from '@hicommonwealth/core';
import { config } from 'dotenv';
import { Unleash } from 'unleash-client';
import { UNLEASH_SERVER_API_TOKEN, UNLEASH_SERVER_URL } from '../config';

config();

const log = logger().getLogger(__filename);

export class UnleashClient {
  private static instance: Unleash = null;

  private constructor() {
    // Private constructor to prevent instantiation
  }

  static getInstance(): Unleash {
    if (!UNLEASH_SERVER_URL) {
      log.info('No unleash server URL found, feature flagging disabled.');
      return null;
    }

    if (!UnleashClient.instance) {
      UnleashClient.instance = new Unleash({
        url: UNLEASH_SERVER_URL,
        appName: 'commonwealth-server',
        customHeaders: { Authorization: UNLEASH_SERVER_API_TOKEN },
      });

      UnleashClient.instance?.on('synchronized', log.info);
    }

    return UnleashClient.instance;
  }
}
