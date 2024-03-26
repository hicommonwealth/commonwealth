import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import axios from 'axios';
import { TypedRequest, TypedResponse, success } from 'server/types';
import Web3 from 'web3';

type SendTransactionRequest = {
  chainId: number;
  transaction: {
    to: string;
    value: string;
    data: string;
  };
};

type SendTransactionResponse = {
  txSuccess: boolean;
  txHash: string;
};

// TODO: get this
const groupOSUrl = '';

const validChainIds = [8453];

export const sendWalletTransactionHandler = async (
  models: DB,
  req: TypedRequest<SendTransactionRequest>,
  res: TypedResponse<SendTransactionResponse>,
) => {
  if (!validChainIds.includes(req.body.chainId)) {
    throw new AppError('Chain not supported for smart accounts');
  }

  const userWallet = await models.Wallets.findOne({
    where: {
      user_id: req.user?.id,
    },
    attributes: ['wallet_address', 'relay_address'],
  });

  if (!userWallet) {
    throw new AppError('No smart wallet found for user');
  }

  const relayPrivateKey = '0x0'; // TODO: Look up given relay address with selected keystore solution

  const web3 = new Web3();
  // TODO: Confirm this signature approach is consistent with groupOS
  const signature = web3.eth.accounts.sign(
    JSON.stringify(req.body.transaction),
    relayPrivateKey,
  );

  const walletResponse = await axios.post(
    `https://${groupOSUrl}/v1/smart-account/transact`,
    {
      chainId: req.body.chainId,
      address: userWallet.wallet_address,
      transaction: req.body.transaction,
      singatures: [signature.signature],
    },
  );

  return success(res, {
    txSuccess: walletResponse.data.success,
    txHash: walletResponse.data.transactionHash,
  });
};
