import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { config } from '../../config';
import { getAllocation } from '../../services/magna/api';

export function GetAllocation(): Query<typeof schemas.GetAllocation> {
  return {
    ...schemas.GetAllocation,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const response = await getAllocation(payload.magna_allocation_id);
      if (response.isProcessed && response.result) {
        const allocation = response.result;
        return {
          magna_allocation_id: allocation.id,
          walletAddress: allocation.walletAddress as `0x${string}`,
          token: config.MAGNA?.TOKEN || '',
          description: config.MAGNA?.EVENT_DESC || '',
          status: allocation.status,
          amount: parseFloat(allocation.amount),
          funded: parseFloat(allocation.funded || '0'),
          claimable: parseFloat(allocation.claimable || '0'),
          unlock_start_at: allocation.unlockStartAt,
        };
      }
      return null;
    },
  };
}
