import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function purgeCache(zoneId?: string, apiKey?: string) {
  if (!zoneId || !apiKey) throw Error('Missing Env Vars');

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
    console.log('Cache purge request successful:');
    console.log(responseData);
  } catch (error) {
    console.error('Error purging cache:', error.message);
  }
}

purgeCache(process.env.CF_ZONE_ID, process.env.CF_API_KEY)
  .then(() => console.log('finished cloudflare purge script'))
  .catch((e) => {
    console.log('cloudflare purge script failed:', e);
  });
