import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { commonProtocol } from '../services';

export function CreateWallet(): Command<typeof schemas.CreateWallet> {
  return {
    ...schemas.CreateWallet,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const existingWallet = await models.Wallets.findOne({
        where: {
          user_id: actor.user.id,
        },
        attributes: ['wallet_address'],
      });
      if (existingWallet) {
        return {
          walletAddress: existingWallet.wallet_address,
          isNew: false,
        };
      }
      const { address, signedMessage } = payload;
      commonProtocol.aaWallet.verifySignature(address, signedMessage);
      const newAccount = await commonProtocol.aaWallet.newSmartAccount([
        address,
      ]);

      await models.Wallets.create({
        user_id: actor.user.id!,
        user_address: address,
        relay_address: newAccount.relayAddress,
        wallet_address: newAccount.walletAddress,
        created_at: new Date(),
      });

      return {
        walletAddress: newAccount.walletAddress,
        isNew: true,
      };
    },
  };
}
