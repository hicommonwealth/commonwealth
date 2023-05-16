import chai from 'chai';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { StdFee } from '@cosmjs/amino';

import { ProposalStatus as ProposalStatusV1 } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import {
  ProposalStatus,
  VoteOption,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { VoteOption as VoteOptionV1 } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import {
  encodeMsgVote,
  encodeMsgSubmitProposal,
  encodeTextProposal,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import {
  getLCDClient,
  getRPCClient,
  getSigningClient,
  getTMClient,
} from 'controllers/chain/cosmos/chain.utils';
import {
  getActiveProposalsV1,
  getCompletedProposalsV1,
} from 'controllers/chain/cosmos/gov/v1/utils-v1';
import { CosmosApiType } from 'controllers/chain/cosmos/chain';
import { LCD } from 'chain-events/src/chain-bases/cosmos/types';

const mnemonic =
  'ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse scrap clutch cup daughter bench length sell goose deliver critic favorite thought';
const DEFAULT_FEE: StdFee = {
  gas: '180000',
  amount: [{ amount: '0', denom: 'ustake' }],
};
const DEFAULT_MEMO = '';
export const deposit = new CosmosToken('stake', 100000, false);

export const setupTestSigner = async (rpcUrl: string) => {
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: 'cosmos',
  });
  const client = await getSigningClient(rpcUrl, signer);
  const accounts = await signer.getAccounts();
  const signerAddress = accounts[0].address;
  return { client, signerAddress };
};

export const sendTx = async (rpcUrl, tx) => {
  const { client, signerAddress } = await setupTestSigner(rpcUrl);
  const result = await client.signAndBroadcast(
    signerAddress,
    [tx],
    DEFAULT_FEE,
    DEFAULT_MEMO
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
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check the current block height again
    const block = await tm.block();
    newHeight = block.block.header.height;
  }
};
