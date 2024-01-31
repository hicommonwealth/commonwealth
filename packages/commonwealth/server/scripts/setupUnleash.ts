import { logger } from '@hicommonwealth/core';
import { config } from 'dotenv';
import { Unleash } from 'unleash-client';
import {
  UNLEASH_BACKEND_API_TOKEN,
  UNLEASH_HEROKU_SERVER_URL,
} from '../config';

config();

export class UnleashClient {
  private static instance: Unleash = null;

  private static log = logger().getLogger(__filename);

  private constructor() {
    // Private constructor to prevent instantiation
  }

  static getInstance(): Unleash {
    if (!UNLEASH_HEROKU_SERVER_URL) {
      this.log.info('No unleash server URL found, feature flagging disabled.');
      return null;
    }

    if (!UnleashClient.instance) {
      UnleashClient.instance = new Unleash({
        url: UNLEASH_HEROKU_SERVER_URL,
        appName: 'commonwealth-app',
        customHeaders: { Authorization: UNLEASH_BACKEND_API_TOKEN },
      });

      UnleashClient.instance?.on('synchronized', () => {
        this.log.info('Unleash started successfully');
      });
    }

    return UnleashClient.instance;
  }
}
