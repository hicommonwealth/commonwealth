import { logger } from '@hicommonwealth/core';
import { delay } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { config } from '../../config';
import { models } from '../../database';

const log = logger(import.meta);

export type TokenAllocationSyncArgs = {
  key: string;
  category: string;
  description: string;
  user_id: number;
  user_name: string;
  wallet_address: string;
  token_allocation: number;
};

async function sendToSlack(created: number) {
  const webhookUrl = config.SLACK.CHANNELS.MAGNA_NOTIFS;
  if (!webhookUrl) {
    log.error(
      'SLACK_WEBHOOK_URL_MAGNA_NOTIFS is not set in the configuration. Cannot send Slack message.',
    );
    return;
  }
  try {
    const payload = {
      text: `:rotating_light: *Attention Product Team!* :rotating_light:\n
*${created} new allocations* have been created in *Magna*.\n
Please check the Magna dashboard for required signatures :memo: :rocket:`,
    };
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const responseBody = await response.text();
      log.error(
        `Error sending message to Slack: ${response.statusText} - ${responseBody}`,
      );
    }
  } catch (error) {
    log.error('Error sending message to Slack:', error as Error);
  }
}

export async function magnaSync(
  apiCallback: (args: TokenAllocationSyncArgs) => Promise<string>,
  batchSize = 10,
  breatherMs = 1000,
) {
  let created = 0;
  let errors = 0;
  try {
    let found = true;
    while (found && errors < 3) {
      // Load next batch of allocations to sync with Magna
      const batch = await models.sequelize.query<TokenAllocationSyncArgs>(
        `
          WITH nft_data AS (
            SELECT user_id, SUM(total_token_allocation) as total_token_allocation
            FROM "NftSnapshot"
            WHERE user_id IS NOT NULL
            GROUP BY user_id
          )
          SELECT
            :category || '-' || A.user_id as key,
            :category as category,
            :description || ' for ' || COALESCE(U.profile->>'name', 'Anonymous') as description,
            A.user_id,
            A.address as wallet_address,
            COALESCE(U.profile->>'name', 'Anonymous-' || A.user_id) as user_name,
            COALESCE(HA.token_allocation, 0)::double precision 
            + COALESCE(AA.token_allocation, 0)::double precision
            + COALESCE(N.total_token_allocation, 0)::double precision as token_allocation
          FROM
            "ClaimAddresses" A -- this is the driving table with sync watermarks
            JOIN "Users" U ON A.user_id = U.id
            LEFT JOIN "HistoricalAllocations" HA ON A.user_id = HA.user_id
            LEFT JOIN "AuraAllocations" AA ON A.user_id = AA.user_id
            LEFT JOIN nft_data N ON A.user_id = N.user_id
          WHERE
            A.address IS NOT NULL -- there is an address to sync
            AND A.magna_synced_at IS NULL -- and it hasn't been synced yet
          ORDER BY
            A.user_id ASC
          LIMIT :limit
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            category: config.MAGNA.EVENT,
            description: config.MAGNA.EVENT_DESC,
            limit: batchSize,
          },
        },
      );
      // break when no more allocations to sync
      if (batch.length === 0) {
        found = false;
        break;
      }

      const promises = batch.map(async (args) => {
        try {
          const allocationId = await apiCallback(args);
          await models.ClaimAddresses.update(
            {
              magna_allocation_id: allocationId,
              magna_synced_at: new Date(),
            },
            { where: { user_id: args.user_id } },
          );
          log.info(`Synced allocation for user ${args.user_id}`);
          created++;
        } catch (err) {
          log.error(
            `Failed to sync allocation for user ${args.user_id}:`,
            err as Error,
          );
        }
      });
      await Promise.all(promises);

      await delay(breatherMs); // take a breath to keep rate limit at BATCH_SIZE/sec
    }
  } catch (err) {
    log.error('Error syncing with Magna', err as Error);
    errors++;
  }
  if (created > 0) await sendToSlack(created);
}
