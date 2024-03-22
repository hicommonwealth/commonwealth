import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { TypedRequest, TypedResponse, success } from 'server/types';
import Web3 from 'web3';

const message =
  'I approve commonwealth to create a smart wallet on behalf of this account';

type CreateWalletRequest = {
  address: string;
  signedMessage: string;
};

type CreateWalletResponse = {
  walletAddress: string;
  new: boolean;
};

export const createWalletHandler = async (
  models: DB,
  req: TypedRequest<CreateWalletRequest>,
  res: TypedResponse<CreateWalletResponse>,
) => {
  const existingWallet = await models.Wallets.findOne({
    where: {
      user_id: req.user?.id,
    },
    attributes: ['wallet_address'],
  });

  if (existingWallet) {
    return success(res, {
      walletAddress: existingWallet.wallet_address,
      new: false,
    });
  }

  // verify signature
  const web3 = new Web3();
  const messageHash = web3.utils.soliditySha3(message);
  const { address, signedMessage } = req.body;

  // Extract the v, r, and s components from the signature
  const signatureComponents = {
    v: '0x' + signedMessage.slice(130, 132),
    r: signedMessage.slice(0, 66),
    s: '0x' + signedMessage.slice(66, 130),
  };
  // Calculate the signer's address
  const signerAddress = web3.eth.accounts.recover({
    messageHash: messageHash,
    v: signatureComponents.v,
    r: signatureComponents.r,
    s: signatureComponents.s,
  });

  if (signerAddress !== address) {
    throw new AppError('Validation Error: Invalid signature');
  }

  // Call groupOS
  let newWalletAddress: string;

  // Insert into DB
  const wallet = await models.Wallets.create({
    user_id: req.user.id,
    user_address: address,
    relay_address: '0x0', //TODO this should be an env var
    wallet_address: newWalletAddress,
  });

  return success(res, {
    walletAddress: wallet.wallet_address,
    new: true,
  });
};
