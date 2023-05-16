import chai from 'chai';

import { ProposalStatus as ProposalStatusV1 } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { VoteOption as VoteOptionV1 } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import {
  encodeMsgVote,
  encodeMsgSubmitProposal,
  encodeTextProposal,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import { getLCDClient } from 'controllers/chain/cosmos/chain.utils';
import {
  getActiveProposalsV1,
  getCompletedProposalsV1,
} from 'controllers/chain/cosmos/gov/v1/utils-v1';
import { LCD } from 'chain-events/src/chain-bases/cosmos/types';
import { deposit, sendTx, setupTestSigner, waitOneBlock } from './helpers';

const { expect, assert } = chai;

const idV1 = 'csdk-v1'; // CI devnet
const rpcUrl = `http://localhost:8080/cosmosAPI/${idV1}`;
const lcdUrl = `http://localhost:8080/cosmosLCD/${idV1}`;

describe('Proposal Transaction Tests - gov v1 chain using v1beta1 signer (csdk-v1)', () => {
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

  it('creates a proposal', async () => {
    const content = encodeTextProposal(`v1 title`, `v1 description`);
    const msg = encodeMsgSubmitProposal(signer, deposit, content);

    const resp = await sendTx(rpcUrl, msg);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;

    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();
    expect(activeProposals.length).to.be.greaterThan(0);
  });
  it('votes NO on an active proposal', async () => {
    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();

    assert.isAtLeast(activeProposals.length, 1);
    const proposal = activeProposals[0];

    const msg = encodeMsgVote(signer, proposal.id, VoteOptionV1.VOTE_OPTION_NO);
    const resp = await sendTx(rpcUrl, msg);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    expect(resp.rawLog).to.include('VOTE_OPTION_NO');
    expect(resp.rawLog).to.not.include('VOTE_OPTION_YES');
  });
  it('votes NO WITH VETO on an active proposal', async () => {
    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();

    assert.isAtLeast(activeProposals.length, 1);
    const proposal = activeProposals[0];

    const msg = encodeMsgVote(
      signer,
      proposal.id,
      VoteOptionV1.VOTE_OPTION_NO_WITH_VETO
    );
    const resp = await sendTx(rpcUrl, msg);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    expect(resp.rawLog).to.include('VOTE_OPTION_NO_WITH_VETO');
    expect(resp.rawLog).to.not.include('VOTE_OPTION_YES');
  });
  it('votes ABSTAIN on an active proposal', async () => {
    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();

    assert.isAtLeast(activeProposals.length, 1);
    const proposal = activeProposals[0];

    const msg = encodeMsgVote(
      signer,
      proposal.id,
      VoteOptionV1.VOTE_OPTION_ABSTAIN
    );
    const resp = await sendTx(rpcUrl, msg);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    expect(resp.rawLog).to.include('VOTE_OPTION_ABSTAIN');
    expect(resp.rawLog).to.not.include('VOTE_OPTION_YES');
  });
  it('votes YES on an active proposal', async () => {
    await waitOneBlock(rpcUrl);
    const activeProposals = await getActiveVotingProposals();

    expect(activeProposals).to.not.be.undefined;
    expect(activeProposals.length).to.be.greaterThan(0);

    const proposal = activeProposals[0];

    const msg = encodeMsgVote(
      signer,
      proposal.id,
      VoteOptionV1.VOTE_OPTION_YES
    );
    const resp = await sendTx(rpcUrl, msg);

    expect(resp.transactionHash).to.not.be.undefined;
    expect(resp.rawLog).to.not.be.undefined;
    expect(resp.rawLog).to.include('VOTE_OPTION_YES');
    expect(resp.rawLog).to.not.include('VOTE_OPTION_NO');
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
