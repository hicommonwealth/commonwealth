import { StdFee } from '@cosmjs/amino';
import { Slip10RawIndex } from '@cosmjs/crypto';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { dispose } from '@hicommonwealth/core';
import { createEvmSigner } from '@hicommonwealth/evm-protocols';
import * as tester from '@hicommonwealth/model/tester';
import { CosmosToken } from 'client/scripts/controllers/chain/cosmos/types';
import { CosmosApiType } from 'controllers/chain/cosmos/chain';
import {
  getRPCClient,
  getTMClient,
} from 'controllers/chain/cosmos/chain.utils';
import EthSigningClient from 'controllers/chain/cosmos/eth_signing_client';
import {
  encodeMsgSubmitProposal,
  encodeMsgVote,
  encodeTextProposal,
  getActiveProposalsV1Beta1,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import {
  ProposalStatus,
  VoteOption,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import Long from 'long';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import EthSigner from './utils/eth-signer';
import { waitOneBlock } from './utils/helpers';

// evmos1yc36qsnpgnnwnhjp5v524lk3cadlq4480u47x2
const mnemonic =
  'extra cute enough manage arctic acid ball divide reduce turtle ' +
  'pony duck remind short find feature tooth steak fix assault vote sad cattle roof';

export const setupTestSigner = async (lcdUrl: string) => {
  const dbId = 'evmos-dev-local';
  const chainId = 'evmos_9000-5';
  const hdPath = [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(60),
    Slip10RawIndex.hardened(0),
    Slip10RawIndex.normal(0),
    Slip10RawIndex.normal(0),
  ];

  const offlineSigner = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: 'evmos',
    hdPaths: [hdPath],
  });
  const ethSigner = createEvmSigner(mnemonic);
  const signer = EthSigner(offlineSigner, ethSigner, 'evmos');

  const client = await EthSigningClient(
    {
      restUrl: lcdUrl,
      chainId,
      path: dbId,
    },
    signer,
  );
  const signerAddress = await signer.getAddress();
  return { client, signerAddress };
};

const DEFAULT_FEE: StdFee = {
  gas: '300000',
  amount: [{ amount: '300000', denom: 'aevmos' }],
};
const DEFAULT_MEMO = '';
const deposit = new CosmosToken('aevmos', 20000000000000000000, false);

export const sendTx = async (lcdUrl, tx) => {
  const { client, signerAddress } = await setupTestSigner(lcdUrl);
  const result = await client.signAndBroadcast(
    signerAddress,
    [tx],
    DEFAULT_FEE,
    DEFAULT_MEMO,
  );
  return result;
};

describe('Proposal Transaction Tests - ethermint chain (evmos-dev-local)', () => {
  const id = 'evmos-dev-local';
  let rpc: CosmosApiType;
  let signerAddr: string;
  const rpcUrl = `http://localhost:8080/cosmosAPI/${id}`;
  const lcdUrl = `http://localhost:8080/cosmosAPI/v1/${id}`;

  beforeAll(async () => {
    await tester.seedDb();
    const tm = await getTMClient(rpcUrl);
    rpc = await getRPCClient(tm);
    const { signerAddress } = await setupTestSigner(lcdUrl);
    signerAddr = signerAddress;
  });

  afterAll(async () => {
    await dispose()();
  });

  const getActiveVotingProposals = async () => {
    const { proposals: activeProposals } = await rpc.gov.proposals(
      ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
      '',
      '',
    );
    return activeProposals;
  };

  const parseVoteValue = (rawLog: string) => {
    const rawObject = JSON.parse(rawLog);
    const optionValue = rawObject[0].events[1].attributes[0].value;
    const vote = optionValue?.split(' ')[0]?.split(':')[1];
    return vote;
  };

  const voteTest = async (
    voteOption: VoteOption,
    expectedVoteString: string,
  ): Promise<void> => {
    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();

    expect(activeProposals.length).toBeGreaterThanOrEqual(1);
    const proposal = activeProposals[activeProposals.length - 1];

    const msg = encodeMsgVote(
      signerAddr,
      proposal.proposalId as Long,
      voteOption,
    );
    const resp = await sendTx(lcdUrl, msg);

    expect(resp.transactionHash).not.toBeUndefined();
    expect(resp.rawLog).not.toBeUndefined();
    const voteValue = parseVoteValue(resp.rawLog);
    expect(voteValue).toEqual(expectedVoteString);
  };

  test('creates a proposal', async () => {
    const content = encodeTextProposal(
      `evmos test title`,
      `evmos test description`,
    );
    const msg = encodeMsgSubmitProposal(signerAddr, deposit, content);

    const resp = await sendTx(lcdUrl, msg);

    expect(resp.transactionHash).not.toBeUndefined();
    expect(resp.rawLog).not.toBeUndefined();

    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();
    expect(activeProposals.length).toBeGreaterThan(0);
  });

  test('votes NO on an active proposal', async () => {
    await voteTest(VoteOption.VOTE_OPTION_NO, 'VOTE_OPTION_NO');
  });

  test('votes NO WITH VETO on an active proposal', async () => {
    await voteTest(
      VoteOption.VOTE_OPTION_NO_WITH_VETO,
      'VOTE_OPTION_NO_WITH_VETO',
    );
  });

  test('votes ABSTAIN on an active proposal', async () => {
    await voteTest(VoteOption.VOTE_OPTION_ABSTAIN, 'VOTE_OPTION_ABSTAIN');
  });

  test('votes YES on an active proposal', async () => {
    await voteTest(VoteOption.VOTE_OPTION_YES, 'VOTE_OPTION_YES');
  });
});

describe('Ethermint Governance v1beta1 util Tests', () => {
  describe('getActiveProposals', () => {
    beforeAll(async () => {
      await tester.seedDb();
    });

    afterAll(async () => {
      await dispose()();
    });

    test('should fetch active proposals (evmos-dev-local)', async () => {
      const id = 'evmos-dev-local'; // CI devnet
      const tmClient = await getTMClient(
        `http://localhost:8080/cosmosAPI/${id}`,
      );
      const rpc = await getRPCClient(tmClient);

      const proposals = await getActiveProposalsV1Beta1(rpc);
      expect(proposals.length).toBeGreaterThan(0);

      proposals.forEach((proposal) => {
        expect(proposal.state.completed).toBe(false);
        expect(['VotingPeriod', 'DepositPeriod']).toContain(
          proposal.state.status,
        );
        expect(proposal.state.tally).not.toBeNull();
      });
    });
  });
});
