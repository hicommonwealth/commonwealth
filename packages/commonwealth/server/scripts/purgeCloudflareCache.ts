import { logger } from '@hicommonwealth/core';
import fetch from 'node-fetch';
import { config } from '../config';

const log = logger(import.meta);

async function purgeCache(zoneId?: string, apiKey?: string) {
  if (!zoneId || !apiKey) {
    log.warn('Missing Cloudflare env variables. Skipping cache purge');
    return;
  }

  const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
  const body = {
    purge_everything: true,
  };
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    const responseData = await response.json();
    log.info('Cache purge request successful:');
    log.info(responseData);
  } catch (error) {
    log.error('Error purging cache:', error.message);
  }
}

purgeCache(config.CLOUDFLARE.ZONE_ID, config.CLOUDFLARE.API_KEY)
  .then(() => log.info('finished cloudflare purge script'))
  .catch((e) => {
    log.error('cloudflare purge script failed:', e);
  });
