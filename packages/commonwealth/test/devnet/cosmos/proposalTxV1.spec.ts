import { isDeliverTxSuccess } from '@cosmjs/stargate';
import { longify } from '@cosmjs/stargate/build/queryclient';
import {
  ProposalStatus as ProposalStatusV1,
  VoteOption as VoteOptionV1,
  voteOptionToJSON,
} from '@hicommonwealth/chains';
import { dispose } from '@hicommonwealth/core';
import * as tester from '@hicommonwealth/model/tester';
import { getLCDClient } from 'controllers/chain/cosmos/chain.utils';
import {
  getActiveProposalsV1,
  getCompletedProposalsV1,
} from 'controllers/chain/cosmos/gov/v1/utils-v1';
import {
  encodeCommunitySpend,
  encodeMsgSubmitProposal,
  encodeMsgVote,
  encodeTextProposal,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import Long from 'long';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { LCD } from '../../../shared/chain/types/cosmos';
import {
  deposit,
  sendTx,
  setupTestSigner,
  waitOneBlock,
} from './utils/helpers';

const idV1 = 'csdk-v1-local'; // V1 CI devnet
const rpcUrl = `http://localhost:8080/cosmosAPI/${idV1}`;
const lcdUrl = `http://localhost:8080/cosmosAPI/v1/${idV1}`;

describe('Proposal Transaction Tests - gov v1 chain using cosmJs signer (csdk-v1-local)', () => {
  let lcd: LCD;
  let signer: string;

  beforeAll(async () => {
    await tester.seedDb();
    lcd = await getLCDClient(lcdUrl);
    const { signerAddress } = await setupTestSigner(rpcUrl);
    signer = signerAddress;
  });

  afterAll(async () => {
    await dispose()();
  });

  const getActiveVotingProposals = async () => {
    const { proposals: activeProposals } = await lcd.cosmos.gov.v1.proposals({
      proposalStatus: ProposalStatusV1.PROPOSAL_STATUS_VOTING_PERIOD,
      voter: '',
      depositor: '',
    });
    return activeProposals;
  };

  const waitForOnchainProposal = async (proposalId: number) => {
    let newProposal;
    while (!newProposal) {
      // Wait for a short period
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const proposalResponse = await lcd.cosmos.gov.v1.proposal({
          proposalId: longify(proposalId) as Long,
        });
        newProposal = proposalResponse.proposal;
      } catch (e) {
        console.error(
          `Error fetching proposal by id ${proposalId}. Trying again...`,
        );
        newProposal = null;
      }
    }

    return newProposal;
  };

  const proposalTest = async (
    content: any,
    expectedProposalType: string,
    isAmino?: boolean,
  ) => {
    const msg = encodeMsgSubmitProposal(signer, deposit, content);
    const resp = await sendTx(rpcUrl, msg, isAmino);

    expect(resp.transactionHash).not.toBeUndefined();
    expect(resp.rawLog).not.toBeUndefined();
    expect(isDeliverTxSuccess(resp)).toBe(true);
    // @ts-expect-error StrictNullChecks
    const rawLog = JSON.parse(resp.rawLog);
    const submitProposalEvent = rawLog[0]?.events?.find(
      (e) => e['type'] === 'submit_proposal',
    );
    const proposalId = submitProposalEvent?.attributes.find(
      (a) => a.key === 'proposal_id',
    )?.value;

    const onChainProposal = await waitForOnchainProposal(proposalId);
    const messageType = onChainProposal.messages[0]?.content['@type'];

    expect(messageType).toEqual(expectedProposalType);
  };

  const voteTest = async (
    voteOption: number,
    isAmino?: boolean,
  ): Promise<void> => {
    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();
    expect(activeProposals.length).toBeGreaterThanOrEqual(1);
    const latestProposal = activeProposals[activeProposals.length - 1];
    const msg = encodeMsgVote(signer, latestProposal.id, voteOption);

    const resp = await sendTx(rpcUrl, msg, isAmino);

    expect(resp.transactionHash).not.toBeUndefined();
    expect(resp.rawLog).not.toBeUndefined();
    expect(resp.rawLog).not.toContain('failed to execute message');
    expect(resp.rawLog).toContain(voteOptionToJSON(voteOption));
  };

  describe('Direct Signer', () => {
    test('creates a text proposal', async () => {
      const content = encodeTextProposal(`v1 title`, `v1 description`);
      await proposalTest(content, '/cosmos.gov.v1beta1.TextProposal');
    });
    test('votes NO on an active proposal', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_NO);
    });
    test('votes NO WITH VETO on an active proposal', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_NO_WITH_VETO);
    });
    test('votes ABSTAIN on an active proposal', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_ABSTAIN);
    });
    test('votes YES on an active proposal', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_YES);
    });
    test('creates a community spend proposal', async () => {
      const content = encodeCommunitySpend(
        `v1 spend title`,
        `v1 spend description`,
        'cosmos18q3tlnx8vguv2fadqslm7x59ejauvsmnlycckg',
        '5',
        'ustake',
      );
      await proposalTest(
        content,
        '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal',
      );
    });
  });
  describe('Amino Signer', () => {
    test('creates a text proposal with legacy amino', async () => {
      const content = encodeTextProposal(`v1 title`, `v1 description`);
      await proposalTest(content, '/cosmos.gov.v1beta1.TextProposal', true);
    });
    test('votes NO on an active proposal with legacy amino', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_NO, true);
    });
    test('votes NO WITH VETO on an active proposal with legacy amino', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_NO_WITH_VETO, true);
    });
    test('votes ABSTAIN on an active proposal with legacy amino', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_ABSTAIN, true);
    });
    test('votes YES on an active proposal with legacy amino', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_YES, true);
    });
    // TODO: Unsupported. Un-skip this in
    // https://github.com/hicommonwealth/commonwealth/issues/4821
    test.skip('creates a community spend proposal with legacy amino', async () => {
      const content = encodeCommunitySpend(
        `v1 spend title amino`,
        `v1 spend description amino`,
        'cosmos18q3tlnx8vguv2fadqslm7x59ejauvsmnlycckg',
        '5',
        'ustake',
      );
      await proposalTest(
        content,
        '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal',
        true,
      );
    });
  });

  // Cosmos gov v1 query tests
  describe('Cosmos Governance v1 util Tests (csdk-v1-local)', () => {
    describe('getActiveProposals', () => {
      test('should fetch active proposals', async () => {
        const proposals = await getActiveProposalsV1(lcd);
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

    describe('getCompletedProposals', () => {
      test('should fetch completed proposals', async () => {
        const proposals = await getCompletedProposalsV1(lcd);

        proposals.forEach((proposal) => {
          expect(proposal.state.completed).toBe(true);
          expect(['Passed', 'Rejected', 'Failed']).toContain(
            proposal.state.status,
          );
        });
      });
    });
  });
});
