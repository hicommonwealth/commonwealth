import { UserInstance, commonProtocol } from '@hicommonwealth/model';
import { ServerWalletController } from '../server_wallet_controller';

export type CreateWalletOptions = {
  user: UserInstance;
  address: string;
  signedMessage: string;
};

export type CreateWalletResult = {
  walletAddress: string;
  new: boolean;
};

export async function __createWallet(
  this: ServerWalletController,
  { user, address, signedMessage }: CreateWalletOptions,
): Promise<CreateWalletResult> {
  const existingWallet = await this.models.Wallets.findOne({
    where: {
      user_id: user.id,
    },
    attributes: ['wallet_address'],
  });
  if (existingWallet) {
    const newAccount = await commonProtocol.aaWallet.newSmartAccount([address]);

    return {
      walletAddress: existingWallet.wallet_address,
      new: false,
    };
  }

  commonProtocol.aaWallet.verifySignature(address, signedMessage);
  const newAccount = await commonProtocol.aaWallet.newSmartAccount([address]);

  const wallet = await this.models.Wallets.create({
    user_id: user.id,
    user_address: address,
    relay_address: newAccount.relayAddress,
    wallet_address: newAccount.walletAddress,
    created_at: new Date(),
  });

  return {
    walletAddress: newAccount.walletAddress,
    new: true,
  };
}
