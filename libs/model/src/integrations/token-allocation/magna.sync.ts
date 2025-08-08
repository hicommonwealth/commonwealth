import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { delay } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';

const log = logger(import.meta);

export type TokenAllocationSyncArgs = {
  user_id: number;
  user_name: string;
  user_email: string;
  wallet_address: string;
  token_allocation: number;
};

/**
 * Callback Response.
 *
 * Should return id if allocation was created or already exists.
 *
 * - id: Allocation ID
 * - error: Error message if failed to create allocation
 */
export type TokenAllocationSyncResponse = { id?: string; error?: string };

export async function magnaSync(
  apiCallback: (
    args: TokenAllocationSyncArgs,
  ) => Promise<TokenAllocationSyncResponse>,
  batchSize = 10,
  breatherMs = 1000,
) {
  try {
    let found = true;
    while (found) {
      // Load next batch of allocations to sync with Magna
      const batch = await models.sequelize.query<TokenAllocationSyncArgs>(
        `
          SELECT
            A.user_id,
            A.address as wallet_address,
            U.profile->>'name' as user_name,
            U.profile->>'email' as user_email,
            -- combined in initial drop?
            COALESCE(HA.token_allocation, 0)::double precision 
            + COALESCE(AA.token_allocation, 0)::double precision as token_allocation
          FROM
            "ClaimAddresses" A -- this is the driving table with sync watermarks
            JOIN "Users" U ON A.user_id = U.id
            LEFT JOIN "HistoricalAllocations" HA ON A.user_id = HA.user_id
            LEFT JOIN "AuraAllocations" AA ON A.user_id = AA.user_id
          WHERE
            A.address IS NOT NULL -- there is an address to sync
            AND A.magna_synced_at IS NULL -- and it hasn't been synced yet
          ORDER BY
            A.user_id ASC
          LIMIT :limit
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { limit: batchSize },
        },
      );
      // break when no more allocations to sync
      if (batch.length === 0) {
        found = false;
        break;
      }

      const promises = batch.map(async (args) => {
        try {
          const response = await apiCallback(args);
          if (response.id) {
            // set sync watermark
            await models.ClaimAddresses.update(
              {
                magna_allocation_id: response.id,
                magna_synced_at: new Date(),
              },
              { where: { user_id: args.user_id } },
            );
            log.info(`Synced allocation for user ${args.user_id}`);
          } else {
            const error = JSON.stringify(response);
            log.error(
              `Failed to sync allocation for user ${args.user_id}: ${error}`,
            );
          }
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
  }
}
