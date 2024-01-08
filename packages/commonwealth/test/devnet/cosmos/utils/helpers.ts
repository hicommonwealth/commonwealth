import { Secp256k1HdWallet, StdFee } from '@cosmjs/amino';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { DeliverTxResponse } from '@cosmjs/stargate';

import { CosmosToken } from 'controllers/chain/cosmos/types';

import {
  getSigningClient,
  getTMClient,
} from 'controllers/chain/cosmos/chain.utils';

const mnemonic =
  `ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse ` +
  `scrap clutch cup daughter bench length sell goose deliver critic favorite thought`;
const DEFAULT_FEE: StdFee = {
  gas: '180000',
  amount: [{ amount: '0', denom: 'ustake' }],
};
const DEFAULT_MEMO = '';
export const deposit = new CosmosToken('ustake', 2000000, false);

export const setupTestSigner = async (rpcUrl: string, isAmino?: boolean) => {
  let signer;
  if (isAmino) {
    signer = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: 'cosmos',
    });
  } else {
    signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: 'cosmos',
    });
  }
  const client = await getSigningClient(rpcUrl, signer);
  const accounts = await signer.getAccounts();
  const signerAddress = accounts[0].address;
  return { client, signerAddress };
};

export const sendTx = async (
  rpcUrl: string,
  tx: any,
  isAmino?: boolean,
): Promise<DeliverTxResponse> => {
  const { client, signerAddress } = await setupTestSigner(rpcUrl, isAmino);
  const result = await client.signAndBroadcast(
    signerAddress,
    [tx],
    DEFAULT_FEE,
    DEFAULT_MEMO,
  );
  return result;
};

export const waitOneBlock = async (rpcUrl: string): Promise<void> => {
  const tm = await getTMClient(rpcUrl);
  // Get the current block height
  const block = await tm.block();
  const currentHeight = block.block.header.height;

  // Set up a loop to check for a new block
  let newHeight = currentHeight;
  while (newHeight === currentHeight) {
    // Wait for a short period
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check the current block height again
    const latestBlock = await tm.block();
    newHeight = latestBlock.block.header.height;
  }
};
