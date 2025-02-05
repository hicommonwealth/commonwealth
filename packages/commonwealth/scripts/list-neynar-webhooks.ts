/*

  Lists all Neynar webhooks.

  Required because the Neynar dashboard UI doesn't show all items.

*/

import { logger } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { exit } from 'process';

const log = logger(import.meta);

const props = ['active', 'webhook_id', 'target_url', 'created_at'];

async function checkProd() {
  // fetch neynar webooks
  const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
  const webhooksRes = await client.fetchWebhooks();
  const webhooks = webhooksRes.webhooks;

  for (const w of webhooks) {
    log.info(w.title);
    for (const key of props) {
      log.info(`\t\t${key} = ${w[key]}`);
    }
    log.info('\n');
  }
}

checkProd().catch((err) => {
  console.error(err);
  exit(1);
});
