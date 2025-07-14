async function purgeCache(zoneId?: string, apiKey?: string) {
  if (!zoneId || !apiKey) {
    console.warn('Missing Cloudflare env variables. Skipping cache purge');
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
    console.info('Cache purge request successful:');
    console.info(responseData);
  } catch (error) {
    console.error('Error purging cache:', error.message);
  }
}

purgeCache(process.env.CF_ZONE_ID, process.env.CF_API_KEY)
  .then(() => console.info('finished cloudflare purge script'))
  .catch((e) => {
    console.error('cloudflare purge script failed:', e);
  });
