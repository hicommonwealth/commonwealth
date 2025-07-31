import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { GraphileTask, TaskPayloads } from '@hicommonwealth/model/services';
import { delay } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { config } from '../../../config';
import * as magnaApi from '../../magna/api';

const log = logger(import.meta);

const contractId = '0xD7DA840121aeb9792b202bd84Db32B2816B30c0e'; // TODO: TBD
const tokenId = '0xD7DA840121aeb9792b202bd84Db32B2816B30c0e';

type SyncArgs = {
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
type SyncResponse = { id?: string; error?: string };

async function createMagnaAllocation({
  user_name,
  user_email,
  wallet_address,
  token_allocation,
}: SyncArgs): Promise<SyncResponse> {
  const response = await magnaApi.createAllocation(
    config.MAGNA.API_URL!,
    config.MAGNA.API_KEY!,
    {
      walletAddress: wallet_address,
      amount: token_allocation.toString(),
      contractId,
      tokenId,
      category: 'Initial Airdrop',
      description: `Allocation for inital C token airdrop for ${user_name}`,
      stakeholder: {
        name: user_name,
        email: user_email,
      },
    },
  );
  // TODO: determine if allocation was created or already exists
  if (response.isProcessed) return { id: response.result.id };
  else return { error: "Couldn't create allocation" };
}

export async function syncWithMagna(
  apiCallback: (args: SyncArgs) => Promise<SyncResponse>,
  breatherMs = 1000,
) {
  try {
    while (true) {
      await delay(breatherMs); // take a breath to keep rate limit at BATCH_SIZE/sec

      // Load next batch of allocations to sync with Magna
      const batch = await models.sequelize.query<SyncArgs>(
        `
          SELECT
            A.user_id,
            U.profile->>'name' as user_name,
            U.profile->>'email' as user_email,
            C.address as wallet_address,
            A.token_allocation
          FROM
            "HistoricalAllocations" A
            JOIN "Users" U ON A.user_id = U.id
            JOIN "ClaimAddresses" C ON A.user_id = C.user_id
          WHERE
            A.magna_synced_at IS NULL AND C.address IS NOT NULL
          ORDER BY
            A.created_at ASC
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

      const promises = batch.map(async (args) => {
        try {
          const response = await apiCallback(args);
          if (response.id) {
            // Mark as synced in DB
            await models.HistoricalAllocations.update(
              { magna_allocation_id: response.id, magna_synced_at: new Date() },
              { where: { user_id: args.user_id } },
            );
            log.info(`Synced allocation for user ${args.user_id}`);
          } else {
            log.error(
              `Failed to sync allocation for user ${args.user_id}: ${response.error}`,
            );
          }
        } catch (err) {
          log.error(`Failed to sync allocation for user ${args.user_id}:`, err);
        }
      });
      await Promise.all(promises);
    }
  } catch (err) {
    log.error('Error syncing with Magna', err);
  }
}

export const magnaSyncTask: GraphileTask<typeof TaskPayloads.MagnaSync> = {
  input: TaskPayloads.MagnaSync,
  fn: async () => {
    if (!config.MAGNA.API_URL || !config.MAGNA.API_KEY) {
      log.error('Missing Magna API config');
      return;
    }
    log.info('Starting MagnaSync job...');
    await syncWithMagna(createMagnaAllocation);
    log.info('MagnaSync job completed!');
  },
};
