import { AppError, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { commonProtocol } from '../services';

export function SendTransaction(): Command<typeof schemas.SendTransaction> {
  return {
    ...schemas.SendTransaction,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const existingWallet = await models.Wallets.findOne({
        where: {
          user_id: actor.user.id,
        },
        attributes: ['wallet_address'],
      });
      if (!existingWallet) {
        throw new AppError('User wallet not found');
      }

      const userOpHash = await commonProtocol.aaWallet.sendUserOp(
        existingWallet.wallet_address,
        payload.to,
        payload.value,
        payload.data,
      );
      return { transaction_hash: userOpHash };
    },
  };
}
