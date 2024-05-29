import { createModularAccountAlchemyClient } from '@alchemy/aa-alchemy';
import {
  LocalAccountSigner,
  SmartAccountSigner,
  sepolia,
} from '@alchemy/aa-core';
import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { TypedRequest, TypedResponse, success } from 'server/types';
import Web3 from 'web3';
const mockSig =
  '0x716eac74630c92680a71eba4c728554480fa94e8f78e3f2f3f2da2b8ee907d09613c53effcd5d9735dd0224fc3e2c329c0d60c673d949225ce58e4b34b65cc481c';
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

  const { address, signedMessage } = req.body;

  // Calculate the signer's address
  const signerAddress = web3.eth.accounts.recover(message, mockSig);

  if (signerAddress.toLowerCase() !== address.toLowerCase()) {
    throw new AppError('Validation Error: Invalid signature');
  }

  // Call alchemy
  let newWalletAddress: string;

  //Figure out specific chain for this
  const chain = sepolia;

  const signer: SmartAccountSigner =
    LocalAccountSigner.privateKeyToAccountSigner(
      `0x${process.env.AA_PRIVATE_KEY}`,
    );
  const AAsignerAddress = await signer.getAddress();

  const smartAccountClient = await createModularAccountAlchemyClient({
    apiKey: '4b9000EKY9q82xeEYKv7FDwq8ViBWA5Y',
    chain,
    signer,
    owners: [AAsignerAddress, `0x${address.replace('0x', '')}`],
  });

  newWalletAddress = smartAccountClient.account.address;
  console.log(newWalletAddress);

  // Insert into DB
  const wallet = await models.Wallets.create({
    user_id: req.user.id,
    user_address: address,
    relay_address: AAsignerAddress,
    wallet_address: newWalletAddress,
    created_at: new Date(),
  });

  return success(res, {
    walletAddress: wallet.wallet_address,
    new: true,
  });
};
