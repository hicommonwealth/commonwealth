import { logger } from '@hicommonwealth/core';
import { TokenAllocationSyncArgs, magnaSync } from '@hicommonwealth/model';
import { TaskPayloads, createAllocation } from '@hicommonwealth/model/services';
import { config } from '../../../config';

const log = logger(import.meta);

async function callback({
  key,
  category,
  description,
  user_name,
  wallet_address,
  token_allocation,
}: TokenAllocationSyncArgs): Promise<string> {
  const response = await createAllocation({
    key,
    category,
    description,
    contractId: config.MAGNA.CONTRACT_ID,
    tokenId: config.MAGNA.TOKEN_ID,
    amount: token_allocation,
    walletAddress: wallet_address,
    stakeholder: { name: user_name },
    unlockScheduleId: config.MAGNA.UNLOCK_SCHEDULE_ID,
    unlockStartAt: config.MAGNA.UNLOCK_START_AT.toISOString(),
  });
  // happy path
  if (response && response.isProcessed && response.result?.id)
    return response.result.id;

  // Handle conflicts: if the allocation already exists, we don't need to create it again
  if (response.error?.context?.existingAllocationId) {
    log.info(
      `Allocation already exists for ${key}: ${response.error.context.existingAllocationId}`,
    );
    return response.error.context.existingAllocationId;
  }

  log.error(`Failed to create allocation for ${key}`, undefined, {
    response,
  });
  throw new Error('Failed to create allocation');
}

export const magnaSyncTask = {
  input: TaskPayloads.MagnaSync,
  fn: async () => {
    if (config.MAGNA.API_KEY) {
      log.info('Starting MagnaSync job...');
      await magnaSync(callback);
      log.info('MagnaSync job completed!');
    }
  },
};
