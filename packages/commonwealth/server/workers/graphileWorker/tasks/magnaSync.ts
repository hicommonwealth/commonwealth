import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { GraphileTask, TaskPayloads } from '@hicommonwealth/model/services';
import { delay } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { config } from '../../../config';
import { createAllocation } from '../../magna';

const log = logger(import.meta);

export const magnaSyncTask: GraphileTask<typeof TaskPayloads.MagnaSync> = {
  input: TaskPayloads.MagnaSync,
  fn: async () => {
    if (!config.MAGNA.API_URL || !config.MAGNA.API_KEY) {
      log.info('MagnaSync cron job not started: missing Magna API config');
      return;
    }
    log.info('Starting MagnaSync cron job');
    try {
      while (true) {
        await delay(1000); // take a breath to keep rate limit at BATCH_SIZE/sec

        // Load next batch of allocations to sync with Magna
        const batch = await models.sequelize.query<{
          user_id: number;
          address: string;
          token_allocation: number;
        }>(
          `
          SELECT A.user_id, C.address, A.token_allocation
          FROM "HistoricalAllocations" A JOIN "ClaimAddresses" C ON A.user_id = C.user_id
          WHERE A.magna_synced_at IS NULL AND C.address IS NOT NULL
          ORDER BY A.created_at ASC
          LIMIT :limit
        `,
          {
            type: QueryTypes.SELECT,
            replacements: {
              limit: config.MAGNA.BATCH_SIZE,
            },
          },
        );
        // break when no more allocations to sync
        if (batch.length === 0) break;

        // Process allocations in parallel with claim addresses
        const updates = batch.map(
          async ({ user_id, address, token_allocation }) => {
            try {
              await createAllocation(
                config.MAGNA.API_URL!,
                config.MAGNA.API_KEY!,
                {
                  walletAddress: address,
                  amount: token_allocation.toString(),
                  contractId: 'TODO',
                  tokenId: 'TODO',
                  category: 'TODO',
                  description: 'TODO',
                  stakeholder: {
                    name: 'TODO',
                    email: 'TODO',
                  },
                },
              );
              // Mark as synced in DB
              await models.HistoricalAllocations.update(
                { magna_synced_at: new Date() },
                { where: { user_id } },
              );
              log.info(`Synced allocation for user ${user_id}`);
            } catch (err) {
              // TODO: check if error is because the allocation already exists
              // and flag it in the DB
              log.error(`Failed to sync allocation for user ${user_id}:`, err);
            }
          },
        );
        await Promise.all(updates);
      }
    } catch (err) {
      log.error('Error syncing with Magna API', err);
    }
    log.info('MagnaSync job completed');
  },
};
