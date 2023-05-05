import chai from 'chai';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { StdFee } from '@cosmjs/amino';

import { ProposalStatus } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { VoteOption } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import {
  encodeMsgVote,
  encodeMsgSubmitProposal,
  encodeTextProposal,
  getCompletedProposalsV1Beta1,
  getActiveProposalsV1Beta1,
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
import { LCD } from 'chain-events/src/chains/cosmos/types';

const { expect, assert } = chai;

const idV1 = 'csdk'; // devnet
const mnemonic =
  'ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse scrap clutch cup daughter bench length sell goose deliver critic favorite thought';
const rpcUrl = `http://localhost:8080/cosmosAPI/${idV1}`;
const DEFAULT_FEE: StdFee = {
  gas: '180000',
  amount: [{ amount: '0', denom: 'ustake' }],
};
const DEFAULT_MEMO = '';
const deposit = new CosmosToken('stake', 100000, false);

const setupTestSigner = async () => {
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: 'cosmos',
  });
  const client = await getSigningClient(rpcUrl, signer);
  const accounts = await signer.getAccounts();
  const signerAddress = accounts[0].address;
  return { client, signerAddress };
};

const sendTx = async (tx) => {
  const { client, signerAddress } = await setupTestSigner();
  const result = await client.signAndBroadcast(
    signerAddress,
    [tx],
    DEFAULT_FEE,
    DEFAULT_MEMO
  );
  return result;
};

const waitOneBlock = async (): Promise<void> => {
  const tm = await getTMClient(rpcUrl);
  // Get the current block height
  const block = await tm.block();
  const currentHeight = block.block.header.height;

  // Set up a loop to check for a new block
  let newHeight = currentHeight;
  while (newHeight === currentHeight) {
    // Wait for a short period
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Check the current block height again
    const block = await tm.block();
    newHeight = block.block.header.height;
  }
};

describe('Proposal Transaction Tests', () => {
  describe('gov v1 chain using v1beta1 signer', () => {
    let lcd: LCD;
    let signer: string;
    beforeEach(async () => {
      lcd = await getLCDClient(`http://localhost:8080/cosmosLCD/${idV1}`);
      const { signerAddress } = await setupTestSigner();
      signer = signerAddress;
    });

    const getActiveVotingProposals = async () => {
      const { proposals: activeProposals } = await lcd.cosmos.gov.v1.proposals({
        proposalStatus: ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
        voter: '',
        depositor: '',
      });
      return activeProposals;
    };

    it('creates a proposal', async () => {
      const { proposals } = await lcd.cosmos.gov.v1.proposals({
        proposalStatus: ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
        voter: '',
        depositor: '',
      });

      const content = encodeTextProposal(`test title`, `test description`);
      const msg = encodeMsgSubmitProposal(signer, deposit, content);

      const resp = await sendTx(msg);

      expect(resp.transactionHash).to.not.be.undefined;
      expect(resp.rawLog).to.not.be.undefined;
    });
    it('votes NO on an active proposal', async () => {
      await waitOneBlock();
      const activeProposals = await getActiveVotingProposals();

      assert.isAtLeast(activeProposals.length, 1);
      const proposal = activeProposals[0];

      const msg = encodeMsgVote(signer, proposal.id, VoteOption.VOTE_OPTION_NO);
      const resp = await sendTx(msg);

      expect(resp.transactionHash).to.not.be.undefined;
      expect(resp.rawLog).to.not.be.undefined;
      expect(resp.rawLog).to.include('VOTE_OPTION_NO');
      expect(resp.rawLog).to.not.include('VOTE_OPTION_YES');
    });
    it('votes NO WITH VETO on an active proposal', async () => {
      await waitOneBlock();
      const activeProposals = await getActiveVotingProposals();

      assert.isAtLeast(activeProposals.length, 1);
      const proposal = activeProposals[0];

      const msg = encodeMsgVote(
        signer,
        proposal.id,
        VoteOption.VOTE_OPTION_NO_WITH_VETO
      );
      const resp = await sendTx(msg);

      expect(resp.transactionHash).to.not.be.undefined;
      expect(resp.rawLog).to.not.be.undefined;
      expect(resp.rawLog).to.include('VOTE_OPTION_NO_WITH_VETO');
      expect(resp.rawLog).to.not.include('VOTE_OPTION_YES');
    });
    it('votes ABSTAIN on an active proposal', async () => {
      await waitOneBlock();
      const activeProposals = await getActiveVotingProposals();

      assert.isAtLeast(activeProposals.length, 1);
      const proposal = activeProposals[0];

      const msg = encodeMsgVote(
        signer,
        proposal.id,
        VoteOption.VOTE_OPTION_ABSTAIN
      );
      const resp = await sendTx(msg);

      expect(resp.transactionHash).to.not.be.undefined;
      expect(resp.rawLog).to.not.be.undefined;
      expect(resp.rawLog).to.include('VOTE_OPTION_ABSTAIN');
      expect(resp.rawLog).to.not.include('VOTE_OPTION_YES');
    });
    it('votes YES on an active proposal', async () => {
      await waitOneBlock();
      const activeProposals = await getActiveVotingProposals();

      expect(activeProposals).to.not.be.undefined;
      expect(activeProposals.length).to.be.greaterThan(0);

      const proposal = activeProposals[0];

      const msg = encodeMsgVote(
        signer,
        proposal.id,
        VoteOption.VOTE_OPTION_YES
      );
      const resp = await sendTx(msg);

      expect(resp.transactionHash).to.not.be.undefined;
      expect(resp.rawLog).to.not.be.undefined;
      expect(resp.rawLog).to.include('VOTE_OPTION_YES');
      expect(resp.rawLog).to.not.include('VOTE_OPTION_NO');
    });
  });

  // Cosmos gov v1 query tests
  describe('Cosmos Governance v1 util Tests', () => {
    describe('csdk-v1', () => {
      let lcd: LCD;
      beforeEach(async () => {
        lcd = await getLCDClient(`http://localhost:8080/cosmosLCD/${idV1}`);
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
  });
});

// TODO: use a v1beta1 devnet for CI testing. See: https://github.com/hicommonwealth/commonwealth/issues/3563
// skipping for CI until then

// Cosmos gov v1beta1 tests
xdescribe('Cosmos Governance v1beta1 util Tests', () => {
  describe('osmosis', () => {
    let rpc: CosmosApiType;
    const id = 'osmosis';
    beforeEach(async () => {
      const tmClient = await getTMClient(
        `http://localhost:8080/cosmosAPI/${id}`
      );
      rpc = await getRPCClient(tmClient);
    });

    describe('getActiveProposals', () => {
      it('should fetch active proposals', async () => {
        const proposals = await getActiveProposalsV1Beta1(rpc);
        expect(proposals.length).to.be.greaterThan(0); // TODO: use better expectation in #3563 (noted above)

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
        const proposals = await getCompletedProposalsV1Beta1(rpc);
        expect(proposals.length).to.be.greaterThan(100);

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
});
