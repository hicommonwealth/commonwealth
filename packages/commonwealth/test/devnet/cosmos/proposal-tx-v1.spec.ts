import chai from 'chai';
import { isDeliverTxSuccess } from '@cosmjs/stargate';

import {
  ProposalStatus as ProposalStatusV1,
  voteOptionToJSON,
} from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { VoteOption as VoteOptionV1 } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import {
  encodeMsgVote,
  encodeMsgSubmitProposal,
  encodeTextProposal,
  encodeCommunitySpend,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import { getLCDClient } from 'controllers/chain/cosmos/chain.utils';
import {
  getActiveProposalsV1,
  getCompletedProposalsV1,
} from 'controllers/chain/cosmos/gov/v1/utils-v1';
import { LCD } from 'chain-events/src/chains/cosmos/types';
import {
  deposit,
  sendTx,
  setupTestSigner,
  waitOneBlock,
} from './utils/helpers';

const { expect, assert } = chai;

const idV1 = 'csdk-v1'; // V1 CI devnet
const rpcUrl = `http://localhost:8080/cosmosAPI/${idV1}`;
const lcdUrl = `http://localhost:8080/cosmosLCD/${idV1}`;

describe('Proposal Transaction Tests - gov v1 chain using cosmJs signer (csdk-v1)', () => {
  let lcd: LCD;
  let signer: string;
  before(async () => {
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

  const proposalTest = async (
    content: any,
    expectedProposalType: string,
    isAmino?: boolean
  ) => {
    const msg = encodeMsgSubmitProposal(signer, deposit, content);
    const resp = await sendTx(rpcUrl, msg, isAmino);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    expect(isDeliverTxSuccess(resp), 'TX failed').to.be.true;

    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();
    const onchainProposal = activeProposals[activeProposals?.length - 1];
    expect(
      (onchainProposal?.messages?.[0] as any)?.content?.['@type']
    ).to.be.eql(expectedProposalType);
  };

  const voteTest = async (
    voteOption: number,
    isAmino?: boolean
  ): Promise<void> => {
    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();
    assert.isAtLeast(activeProposals.length, 1);
    const proposal = activeProposals[0];
    const msg = encodeMsgVote(signer, proposal.id, voteOption);

    const resp = await sendTx(rpcUrl, msg, isAmino);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
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
      await waitOneBlock(rpcUrl);
      const content = encodeCommunitySpend(
        `v1 spend title`,
        `v1 spend description`,
        'cosmos18q3tlnx8vguv2fadqslm7x59ejauvsmnlycckg',
        '5',
        'ustake'
      );
      await proposalTest(
        content,
        '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal'
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
      await waitOneBlock(rpcUrl);
      const content = encodeCommunitySpend(
        `v1 spend title amino`,
        `v1 spend description amino`,
        'cosmos18q3tlnx8vguv2fadqslm7x59ejauvsmnlycckg',
        '5',
        'ustake'
      );
      await proposalTest(
        content,
        '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal',
        true
      );
    });
  });
});

// Cosmos gov v1 query tests
describe('Cosmos Governance v1 util Tests (csdk-v1)', () => {
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
