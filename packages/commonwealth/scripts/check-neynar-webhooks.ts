/*

  Checks production for unused Farcaster
  Neynar webhooks and optionally deletes them.

  Unused means that the associated contest has ended
  so the webhook is no longer needed. A webhook
  is supposed to be automatically deleted when the
  associated contest ends, but if not, it'll show up here.

*/

import { logger } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import axios from 'axios';
import { sleep } from 'client/scripts/helpers';
import { exit } from 'process';
import readline from 'readline';

const log = logger(import.meta);

async function checkProd() {
  // fetch neynar webooks
  const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
  const webhooksRes = await client.fetchWebhooks();
  const webhooks = webhooksRes.webhooks.filter(
    (w) =>
      w.active &&
      w.title.startsWith('farcaster-contest-webhook-') &&
      w.target_url.startsWith('https://common.xyz'),
  );

  // fetch the frame for each contest to see if active or not
  const unusedWebhooks: typeof webhooks = [];
  for (const w of webhooks) {
    const contestAddress = w.title.split('-')[3];
    const res = await axios.get(buildFrameUrl(contestAddress));
    const frameData = res.data as string;
    const devUrl = buildDevUrl(w.webhook_id);
    if (frameData.includes('<title>Contest Ended</title>')) {
      unusedWebhooks.push(w);
      log.warn(`CONTEST ENDED: ${contestAddress} – ${devUrl}`);
    } else if (frameData.includes('<title>Contest not found</title>')) {
      unusedWebhooks.push(w);
      log.warn(`CONTEST NOT FOUND: ${contestAddress} – ${devUrl}`);
    }
  }

  if (unusedWebhooks.length === 0) {
    return;
  }

  await sleep(1_000);

  // prompt to cleanup webhooks
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Cleanup unused webhooks? Enter "y" to proceed: ', (answer) => {
    rl.close();
    if (answer.toLowerCase().trim() === 'y') {
      const ids = unusedWebhooks.map((w) => w.webhook_id);
      deleteWebhooks(ids).catch(console.error);
    }
  });
}

function buildFrameUrl(contestAddress: string) {
  return `https://commonwealth.im/api/integration/farcaster/contests/${contestAddress}/contestCard`;
}

function buildDevUrl(webhookId: string) {
  return `https://dev.neynar.com/webhook/${webhookId}`;
}

async function deleteWebhooks(webhookIds: string[]) {
  const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
  for (const wid of webhookIds) {
    await client.deleteWebhook(wid);
    log.debug(`Deleted webhook: ${wid}`);
  }
}

checkProd().catch((err) => {
  console.error(err);
  exit(1);
});
