import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { AuthContext, isAuthorized } from '../middleware';
import {
  createTokenHandler,
  transactionHashToTokenAddress,
} from '../services/commonProtocol/launchpadHelpers';

export function CreateToken(): Command<
  typeof schemas.CreateToken,
  AuthContext
> {
  return {
    ...schemas.CreateToken,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ payload }) => {
      const { chain_node_id, transaction_hash, description, icon_url } =
        payload;

      const tokenAddress = await transactionHashToTokenAddress(
        transaction_hash,
        chain_node_id,
      );
      return await createTokenHandler(
        chain_node_id,
        tokenAddress,
        description!,
        icon_url!,
      );
    },
  };
}
