import { logger } from '@hicommonwealth/core';
import { TokenAllocationSyncArgs, magnaSync } from '@hicommonwealth/model';
import { GraphileTask, TaskPayloads } from '@hicommonwealth/model/services';
import { config } from '../../../config';
import * as magnaApi from '../../magna/api';

const log = logger(import.meta);

async function createMagnaAllocation({
  key,
  category,
  description,
  user_name,
  user_email,
  wallet_address,
  token_allocation,
}: TokenAllocationSyncArgs): Promise<boolean> {
  const response = await magnaApi.createAllocation(
    config.MAGNA!.API_URL,
    config.MAGNA!.API_KEY,
    {
      key,
      category,
      description,
      contractId: config.MAGNA!.CONTRACT_ID,
      tokenId: config.MAGNA!.TOKEN_ID,
      amount: token_allocation,
      walletAddress: wallet_address,
      stakeholder: user_email
        ? {
            name: user_name,
            email: user_email,
          }
        : { name: user_name },
      unlockScheduleId: config.MAGNA!.UNLOCK_SCHEDULE_ID,
      unlockStartAt: config.MAGNA!.UNLOCK_START_AT.toISOString(),
    },
  );
  return response.isProcessed;
}

export const magnaSyncTask: GraphileTask<typeof TaskPayloads.MagnaSync> = {
  input: TaskPayloads.MagnaSync,
  fn: async () => {
    if (!config.MAGNA) {
      log.error('Missing Magna configuration');
      return;
    }
    log.info('Starting MagnaSync job...');
    await magnaSync(createMagnaAllocation);
    log.info('MagnaSync job completed!');
  },
};
