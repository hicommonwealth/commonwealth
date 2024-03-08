import { isDeliverTxSuccess } from '@cosmjs/stargate';
import chai from 'chai';

import { longify } from '@cosmjs/stargate/build/queryclient';
import {
  ProposalStatus as ProposalStatusV1,
  VoteOption as VoteOptionV1,
  voteOptionToJSON,
} from '@hicommonwealth/chains';
import { tester } from '@hicommonwealth/model';
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
import { LCD } from '../../../shared/chain/types/cosmos';
import {
  deposit,
  sendTx,
  setupTestSigner,
  waitOneBlock,
} from './utils/helpers';

const { expect, assert } = chai;

const idV1 = 'csdk-v1-ci'; // V1 CI devnet
const rpcUrl = `http://localhost:8080/cosmosAPI/${idV1}`;
const lcdUrl = `http://localhost:8080/cosmosAPI/v1/${idV1}`;

describe('Proposal Transaction Tests - gov v1 chain using cosmJs signer (csdk-v1-ci)', () => {
  let lcd: LCD;
  let signer: string;
  before(async () => {
    await tester.seedDb();
    lcd = await getLCDClient(lcdUrl);
    const { signerAddress } = await setupTestSigner(rpcUrl);
    signer = signerAddress;
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
          proposalId: longify(proposalId),
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

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    expect(isDeliverTxSuccess(resp), 'TX failed').to.be.true;
    const rawLog = JSON.parse(resp.rawLog);
    const submitProposalEvent = rawLog[0]?.events?.find(
      (e) => e['type'] === 'submit_proposal',
    );
    const proposalId = submitProposalEvent?.attributes.find(
      (a) => a.key === 'proposal_id',
    )?.value;

    const onChainProposal = await waitForOnchainProposal(proposalId);
    const messageType = onChainProposal.messages[0]?.content['@type'];

    expect(messageType).to.eql(expectedProposalType);
  };

  const voteTest = async (
    voteOption: number,
    isAmino?: boolean,
  ): Promise<void> => {
    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();
    assert.isAtLeast(activeProposals.length, 1);
    const latestProposal = activeProposals[activeProposals.length - 1];
    const msg = encodeMsgVote(signer, latestProposal.id, voteOption);

    const resp = await sendTx(rpcUrl, msg, isAmino);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    expect(resp.rawLog).to.not.include('failed to execute message');
    expect(resp.rawLog).to.include(voteOptionToJSON(voteOption));
  };

  describe('Direct Signer', () => {
    it('creates a text proposal', async () => {
      const content = encodeTextProposal(`v1 title`, `v1 description`);
      await proposalTest(content, '/cosmos.gov.v1beta1.TextProposal');
    });
    it('votes NO on an active proposal', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_NO);
    });
    it('votes NO WITH VETO on an active proposal', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_NO_WITH_VETO);
    });
    it('votes ABSTAIN on an active proposal', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_ABSTAIN);
    });
    it('votes YES on an active proposal', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_YES);
    });
    it('creates a community spend proposal', async () => {
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
    it('creates a text proposal with legacy amino', async () => {
      const content = encodeTextProposal(`v1 title`, `v1 description`);
      await proposalTest(content, '/cosmos.gov.v1beta1.TextProposal', true);
    });
    it('votes NO on an active proposal with legacy amino', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_NO, true);
    });
    it('votes NO WITH VETO on an active proposal with legacy amino', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_NO_WITH_VETO, true);
    });
    it('votes ABSTAIN on an active proposal with legacy amino', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_ABSTAIN, true);
    });
    it('votes YES on an active proposal with legacy amino', async () => {
      await voteTest(VoteOptionV1.VOTE_OPTION_YES, true);
    });
    // TODO: Unsupported. Un-skip this in
    // https://github.com/hicommonwealth/commonwealth/issues/4821
    it.skip('creates a community spend proposal with legacy amino', async () => {
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
});

// Cosmos gov v1 query tests
describe('Cosmos Governance v1 util Tests (csdk-v1-ci)', () => {
  let lcd: LCD;
  before(async () => {
    lcd = await getLCDClient(lcdUrl);
  });

  describe('getActiveProposals', () => {
    it('should fetch active proposals', async () => {
      const proposals = await getActiveProposalsV1(lcd);
      expect(proposals.length).to.be.greaterThan(0);

      proposals.forEach((proposal) => {
        expect(proposal.state.completed).to.eq(false);
        expect(proposal.state.status).to.be.oneOf([
          'VotingPeriod',
          'DepositPeriod',
        ]);
        expect(proposal.state.tally).to.not.be.null;
      });
    });
  });
  describe('getCompletedProposals', () => {
    it('should fetch completed proposals', async () => {
      const proposals = await getCompletedProposalsV1(lcd);

      proposals.forEach((proposal) => {
        expect(proposal.state.completed).to.eq(true);
        expect(proposal.state.status).to.be.oneOf([
          'Passed',
          'Rejected',
          'Failed',
        ]);
      });
    });
  });
});
