import { isDeliverTxSuccess } from '@cosmjs/stargate';
import { tester } from '@hicommonwealth/model';
import chai from 'chai';
import { CosmosApiType } from 'controllers/chain/cosmos/chain';
import {
  getRPCClient,
  getTMClient,
} from 'controllers/chain/cosmos/chain.utils';
import {
  encodeCommunitySpend,
  encodeMsgSubmitProposal,
  encodeMsgVote,
  encodeTextProposal,
  getActiveProposalsV1Beta1,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import {
  ProposalStatus,
  VoteOption,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import {
  deposit,
  sendTx,
  setupTestSigner,
  waitOneBlock,
} from './utils/helpers';

const { expect, assert } = chai;

describe('Proposal Transaction Tests - gov v1beta1 chain (csdk-beta-local)', () => {
  let rpc: CosmosApiType;
  let signer: string;
  // v1beta1 CI devnet
  const betaId = 'csdk-beta-local';
  const rpcUrlBeta = `http://localhost:8080/cosmosAPI/${betaId}`;

  before(async () => {
    await tester.seedDb();
    const tm = await getTMClient(rpcUrlBeta);
    rpc = await getRPCClient(tm);
    const { signerAddress } = await setupTestSigner(rpcUrlBeta);
    signer = signerAddress;
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
    const vote = JSON.parse(optionValue);
    return vote;
  };

  const proposalTest = async (
    content: any,
    expectedProposalType: string,
    isAmino?: boolean,
  ) => {
    const msg = encodeMsgSubmitProposal(signer, deposit, content);
    const resp = await sendTx(rpcUrlBeta, msg, isAmino);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    expect(isDeliverTxSuccess(resp), 'TX failed').to.be.true;

    const rawLog = JSON.parse(resp.rawLog);

    const submitProposalEvent = rawLog[0]?.events?.find(
      (e) => e['type'] === 'submit_proposal',
    );
    const proposalType = submitProposalEvent?.attributes.find(
      (a) => a.key === 'proposal_type',
    )?.value;

    expect(proposalType).to.eql(expectedProposalType);
  };

  const voteTest = async (
    voteOption: number,
    isAmino?: boolean,
  ): Promise<void> => {
    await waitOneBlock(rpcUrlBeta);
    const activeProposals = await getActiveVotingProposals();
    assert.isAtLeast(activeProposals.length, 1);
    const proposal = activeProposals[activeProposals.length - 1];
    const msg = encodeMsgVote(signer, proposal.proposalId, voteOption);

    const resp = await sendTx(rpcUrlBeta, msg, isAmino);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    const voteValue = parseVoteValue(resp.rawLog);
    expect(voteValue.option).to.eql(voteOption);
  };

  describe('Direct signer', () => {
    it('creates a text proposal', async () => {
      const content = encodeTextProposal(
        `beta text title`,
        `beta text description`,
      );
      await proposalTest(content, 'Text');
    });
    it('votes NO on an active proposal', async () => {
      await voteTest(VoteOption.VOTE_OPTION_NO);
    });
    it('votes NO WITH VETO on an active proposal', async () => {
      await voteTest(VoteOption.VOTE_OPTION_NO_WITH_VETO);
    });
    it('votes ABSTAIN on an active proposal', async () => {
      await voteTest(VoteOption.VOTE_OPTION_ABSTAIN);
    });
    it('votes YES on an active proposal', async () => {
      await voteTest(VoteOption.VOTE_OPTION_YES);
    });
    it('creates a community spend proposal', async () => {
      await waitOneBlock(rpcUrlBeta);
      const content = encodeCommunitySpend(
        `beta spend title`,
        `beta spend description`,
        'cosmos18q3tlnx8vguv2fadqslm7x59ejauvsmnlycckg',
        '5',
        'ustake',
      );
      await proposalTest(content, 'CommunityPoolSpend');
    });
  });

  describe('Amino signing', () => {
    it('creates a text proposal with legacy amino', async () => {
      await waitOneBlock(rpcUrlBeta);
      const content = encodeTextProposal(
        `beta text title`,
        `beta text description`,
      );
      await proposalTest(content, 'Text', true);
    });
    it('votes NO on an active proposal with legacy amino', async () => {
      await voteTest(VoteOption.VOTE_OPTION_NO, true);
    });
    it('votes NO WITH VETO on an active proposal with legacy amino', async () => {
      await voteTest(VoteOption.VOTE_OPTION_NO_WITH_VETO, true);
    });
    it('votes ABSTAIN on an active proposal with legacy amino', async () => {
      await voteTest(VoteOption.VOTE_OPTION_ABSTAIN, true);
    });
    it('votes YES on an active proposal with legacy amino', async () => {
      await voteTest(VoteOption.VOTE_OPTION_YES, true);
    });
    it('creates a community spend proposal with legacy amino', async () => {
      await waitOneBlock(rpcUrlBeta);
      const content = encodeCommunitySpend(
        `beta spend title amino`,
        `beta spend description amino`,
        'cosmos18q3tlnx8vguv2fadqslm7x59ejauvsmnlycckg',
        '5',
        'ustake',
      );
      await proposalTest(content, 'CommunityPoolSpend', true);
    });
  });
});

describe('Cosmos Governance v1beta1 util Tests', () => {
  describe('getActiveProposals', () => {
    it('should fetch active proposals (csdk-beta-local)', async () => {
      const id = 'csdk-beta-local'; // CI devnet for v1beta1
      const tmClient = await getTMClient(
        `http://localhost:8080/cosmosAPI/${id}`,
      );
      const rpc = await getRPCClient(tmClient);

      const proposals = await getActiveProposalsV1Beta1(rpc);
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
});
