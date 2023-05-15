import chai from 'chai';
import {
  ProposalStatus,
  VoteOption,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import {
  encodeMsgVote,
  encodeMsgSubmitProposal,
  encodeTextProposal,
  getCompletedProposalsV1Beta1,
  getActiveProposalsV1Beta1,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import {
  getRPCClient,
  getTMClient,
} from 'controllers/chain/cosmos/chain.utils';
import { CosmosApiType } from 'controllers/chain/cosmos/chain';
import { deposit, sendTx, setupTestSigner, waitOneBlock } from './helpers';

const { expect, assert } = chai;

describe('Proposal Transaction Tests - gov v1beta1 chain (csdk-beta-ci)', () => {
  // v1beta1 ci devnet
  let rpc: CosmosApiType;
  let signer: string;
  const betaId = 'csdk-beta-ci';
  const rpcUrlBeta = `http://localhost:8080/cosmosAPI/${betaId}`;

  before(async () => {
    const tm = await getTMClient(rpcUrlBeta);
    rpc = await getRPCClient(tm);
    const { signerAddress } = await setupTestSigner(rpcUrlBeta);
    signer = signerAddress;
  });

  const getActiveVotingProposals = async () => {
    const { proposals: activeProposals } = await rpc.gov.proposals(
      ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
      '',
      ''
    );
    return activeProposals;
  };

  const parseVoteValue = (rawLog: string) => {
    const rawObject = JSON.parse(rawLog);
    const optionValue = rawObject[0].events[1].attributes[0].value;
    const vote = JSON.parse(optionValue);
    return vote;
  };

  it('creates a proposal', async () => {
    const content = encodeTextProposal(
      `beta test title`,
      `beta test description`
    );
    const msg = encodeMsgSubmitProposal(signer, deposit, content);

    const resp = await sendTx(rpcUrlBeta, msg);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;

    await waitOneBlock(rpcUrlBeta);
    const activeProposals = await getActiveVotingProposals();
    expect(activeProposals.length).to.be.greaterThan(0);
  });
  it('votes NO on an active proposal', async () => {
    await waitOneBlock(rpcUrlBeta);
    const activeProposals = await getActiveVotingProposals();

    assert.isAtLeast(activeProposals.length, 1);
    const proposal = activeProposals[0];

    const msg = encodeMsgVote(
      signer,
      proposal.proposalId,
      VoteOption.VOTE_OPTION_NO
    );
    const resp = await sendTx(rpcUrlBeta, msg);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    const voteValue = parseVoteValue(resp.rawLog);
    expect(voteValue.option).to.eql(VoteOption.VOTE_OPTION_NO);
  });
  it('votes NO WITH VETO on an active proposal', async () => {
    await waitOneBlock(rpcUrlBeta);
    const activeProposals = await getActiveVotingProposals();

    assert.isAtLeast(activeProposals.length, 1);
    const proposal = activeProposals[0];

    const msg = encodeMsgVote(
      signer,
      proposal.proposalId,
      VoteOption.VOTE_OPTION_NO_WITH_VETO
    );
    const resp = await sendTx(rpcUrlBeta, msg);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    const voteValue = parseVoteValue(resp.rawLog);
    expect(voteValue.option).to.eql(VoteOption.VOTE_OPTION_NO_WITH_VETO);
  });
  it('votes ABSTAIN on an active proposal', async () => {
    await waitOneBlock(rpcUrlBeta);
    const activeProposals = await getActiveVotingProposals();

    assert.isAtLeast(activeProposals.length, 1);
    const proposal = activeProposals[0];

    const msg = encodeMsgVote(
      signer,
      proposal.proposalId,
      VoteOption.VOTE_OPTION_ABSTAIN
    );
    const resp = await sendTx(rpcUrlBeta, msg);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    const voteValue = parseVoteValue(resp.rawLog);
    expect(voteValue.option).to.eql(VoteOption.VOTE_OPTION_ABSTAIN);
  });
  it('votes YES on an active proposal', async () => {
    await waitOneBlock(rpcUrlBeta);
    const activeProposals = await getActiveVotingProposals();

    expect(activeProposals).to.not.be.undefined;
    expect(activeProposals.length).to.be.greaterThan(0);

    const proposal = activeProposals[0];

    const msg = encodeMsgVote(
      signer,
      proposal.proposalId,
      VoteOption.VOTE_OPTION_YES
    );
    const resp = await sendTx(rpcUrlBeta, msg);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    const voteValue = parseVoteValue(resp.rawLog);
    expect(voteValue.option).to.eql(VoteOption.VOTE_OPTION_YES);
  });
});

describe('Cosmos Governance v1beta1 util Tests', () => {
  describe('getActiveProposals', () => {
    it('should fetch active proposals (csdk-beta-ci)', async () => {
      const id = 'csdk-beta-ci'; // CI devnet for v1beta1
      const tmClient = await getTMClient(
        `http://localhost:8080/cosmosAPI/${id}`
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
  describe('getCompletedProposals', () => {
    it('should fetch completed proposals (csdk-beta)', async () => {
      const id = 'csdk-beta';
      const tmClient = await getTMClient(
        `http://localhost:8080/cosmosAPI/${id}`
      );
      const rpc = await getRPCClient(tmClient);
      const proposals = await getCompletedProposalsV1Beta1(rpc);
      // if below fails, make a proposal in csdk-beta UI and run again after 10 minutes.
      // Somstimes the remote node crashes and restarts.
      expect(
        proposals.length,
        'If this fails, make a proposal in csdk-beta UI and run tests again after 10 minutes.'
      ).to.be.greaterThan(0);

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
