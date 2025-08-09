import { logger } from '@hicommonwealth/core';
import {
  TokenAllocationSyncArgs,
  TokenAllocationSyncResponse,
  magnaSync,
} from '@hicommonwealth/model';
import { TaskPayloads } from '@hicommonwealth/model/services';
import { config } from '../../../config';
import * as magnaApi from '../../magna/api';

const log = logger(import.meta);

// Common Token
const tokenId = '0xD7DA840121aeb9792b202bd84Db32B2816B30c0e';

async function createMagnaAllocation({
  user_name,
  user_email,
  wallet_address,
  token_allocation,
}: TokenAllocationSyncArgs): Promise<TokenAllocationSyncResponse> {
  const response = await magnaApi.createAllocation(
    config.MAGNA.API_URL!,
    config.MAGNA.API_KEY!,
    {
      walletAddress: wallet_address,
      amount: token_allocation.toString(),
      contractId: config.MAGNA.CONTRACT_ID!,
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

export const magnaSyncTask = {
  input: TaskPayloads.MagnaSync,
  fn: async () => {
    if (
      !config.MAGNA.API_URL ||
      !config.MAGNA.API_KEY ||
      !config.MAGNA.CONTRACT_ID
    ) {
      log.error('Missing Magna configuration');
      return;
    }
    log.info('Starting MagnaSync job...');
    await magnaSync(createMagnaAllocation);
    log.info('MagnaSync job completed!');
  },
};
