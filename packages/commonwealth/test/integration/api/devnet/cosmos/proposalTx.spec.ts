import chai from 'chai';

import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { StdFee } from '@cosmjs/amino';
import { CosmosToken } from 'client/scripts/controllers/chain/cosmos/types';
import { ProposalStatus } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { VoteOption } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import {
  encodeMsgVote,
  encodeMsgSubmitProposal,
  getSigningClient,
} from 'client/scripts/controllers/chain/cosmos/helpers';
import { TextProposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { Any } from 'common-common/src/cosmos-ts/src/codegen/google/protobuf/any';

const mnemonic =
  'ignore medal pitch lesson catch stadium victory jewel first stairs humble excuse scrap clutch cup daughter bench length sell goose deliver critic favorite thought';
const rpcUrl = `http://localhost:8080/cosmosAPI/csdk`;
const lcdUrl = `http://localhost:8080/cosmosLCD/csdk`;
const DEFAULT_FEE: StdFee = {
  gas: '180000',
  amount: [{ amount: '0', denom: 'ustake' }],
};
const DEFAULT_MEMO = '';
const deposit = new CosmosToken('stake', 100000, false);

const setupTM = async () => {
  const tm = await import('@cosmjs/tendermint-rpc');
  const tmClient = await tm.Tendermint34Client.connect(rpcUrl);
  return tmClient;
};

const setupLCD = async () => {
  const { createLCDClient } = await import(
    'common-common/src/cosmos-ts/src/codegen/cosmos/lcd'
  );

  const lcd = await createLCDClient({
    restEndpoint: lcdUrl,
  });
  return lcd;
};

const setupSigner = async () => {
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: 'cosmos',
  });
  const client = await getSigningClient(rpcUrl, signer);
  const accounts = await signer.getAccounts();
  const signerAddress = accounts[0].address;
  return { client, signerAddress };
};

const sendTx = async (tx) => {
  const { client, signerAddress } = await setupSigner();
  const result = await client.signAndBroadcast(
    signerAddress,
    [tx],
    DEFAULT_FEE,
    DEFAULT_MEMO
  );
  return result;
};

const encodeTextProposalAny = (title: string, description: string): Any => {
  const tProp = TextProposal.fromPartial({ title, description });
  return Any.fromPartial({
    typeUrl: '/cosmos.gov.v1beta1.TextProposal',
    value: Uint8Array.from(TextProposal.encode(tProp).finish()),
  });
};

const waitOneBlock = async (): Promise<void> => {
  const tm = await setupTM();
  // Get the current block height
  const block = await tm.block();
  const currentHeight = block.block.header.height;

  // Set up a loop to check for a new block
  let newHeight = currentHeight;
  while (newHeight === currentHeight) {
    // Wait for a short period
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check the current block height again
    const block = await tm.block();
    newHeight = block.block.header.height;
  }
};

describe('Proposal Tests', () => {
  describe('gov v1 chain using v1beta1 signer', () => {
    it('creates a proposal', async () => {
      const lcd = await setupLCD();
      const { signerAddress } = await setupSigner();

      const { proposals } = await lcd.cosmos.gov.v1.proposals({
        proposalStatus: ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
        voter: '',
        depositor: '',
      });

      const beforeCount = proposals.length;

      const content = encodeTextProposalAny(
        `title ${beforeCount + 1}`,
        `description ${beforeCount + 1}`
      );
      const msg = encodeMsgSubmitProposal(signerAddress, deposit, content);

      const resp = await sendTx(msg);

      chai.assert.isDefined(resp.transactionHash);
      chai.assert.isDefined(resp.rawLog);

      await waitOneBlock();

      const { proposals: proposalsAfter } = await lcd.cosmos.gov.v1.proposals({
        proposalStatus: ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
        voter: '',
        depositor: '',
      });

      chai.assert.equal(proposalsAfter.length, beforeCount + 1);
    });
    it('votes NO on an active proposal', async () => {
      const lcd = await setupLCD();
      const { signerAddress } = await setupSigner();
      await waitOneBlock();

      const { proposals: activeProposals } = await lcd.cosmos.gov.v1.proposals({
        proposalStatus: ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
        voter: '',
        depositor: '',
      });

      chai.assert.isAtLeast(activeProposals.length, 1);
      const proposal = activeProposals[0];

      const msg = encodeMsgVote(
        signerAddress,
        proposal.id,
        VoteOption.VOTE_OPTION_NO
      );
      const resp = await sendTx(msg);

      chai.assert.isDefined(resp.transactionHash);
      chai.assert.isDefined(resp.rawLog);
      chai.assert.isTrue(resp.rawLog.includes('VOTE_OPTION_NO'));
      chai.assert.isFalse(resp.rawLog.includes('VOTE_OPTION_YES'));
    });
    it('votes NO WITH VETO on an active proposal', async () => {
      const lcd = await setupLCD();
      const { signerAddress } = await setupSigner();
      await waitOneBlock();

      const { proposals: activeProposals } = await lcd.cosmos.gov.v1.proposals({
        proposalStatus: ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
        voter: '',
        depositor: '',
      });

      chai.assert.isAtLeast(activeProposals.length, 1);
      const proposal = activeProposals[0];

      const msg = encodeMsgVote(
        signerAddress,
        proposal.id,
        VoteOption.VOTE_OPTION_NO_WITH_VETO
      );
      const resp = await sendTx(msg);

      chai.assert.isDefined(resp.transactionHash);
      chai.assert.isDefined(resp.rawLog);
      chai.assert.isTrue(resp.rawLog.includes('VOTE_OPTION_NO_WITH_VETO'));
      chai.assert.isFalse(resp.rawLog.includes('VOTE_OPTION_YES'));
    });
    it('votes ABSTAIN on an active proposal', async () => {
      const lcd = await setupLCD();
      const { signerAddress } = await setupSigner();
      await waitOneBlock();

      const { proposals: activeProposals } = await lcd.cosmos.gov.v1.proposals({
        proposalStatus: ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
        voter: '',
        depositor: '',
      });

      chai.assert.isAtLeast(activeProposals.length, 1);
      const proposal = activeProposals[0];

      const msg = encodeMsgVote(
        signerAddress,
        proposal.id,
        VoteOption.VOTE_OPTION_ABSTAIN
      );
      const resp = await sendTx(msg);

      chai.assert.isDefined(resp.transactionHash);
      chai.assert.isDefined(resp.rawLog);
      chai.assert.isTrue(resp.rawLog.includes('VOTE_OPTION_ABSTAIN'));
      chai.assert.isFalse(resp.rawLog.includes('VOTE_OPTION_YES'));
    });
    it('votes YES on an active proposal', async () => {
      await waitOneBlock();
      const lcd = await setupLCD();
      const { signerAddress } = await setupSigner();

      const { proposals: activeProposals } = await lcd.cosmos.gov.v1.proposals({
        proposalStatus: ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
        voter: '',
        depositor: '',
      });

      chai.assert.isDefined(activeProposals);
      chai.assert.isAtLeast(activeProposals.length, 1);
      const proposal = activeProposals[0];

      const msg = encodeMsgVote(
        signerAddress,
        proposal.id,
        VoteOption.VOTE_OPTION_YES
      );
      const resp = await sendTx(msg);

      chai.assert.isDefined(resp.transactionHash);
      chai.assert.isDefined(resp.rawLog);
      chai.assert.isTrue(resp.rawLog.includes('VOTE_OPTION_YES'));
      chai.assert.isFalse(resp.rawLog.includes('VOTE_OPTION_NO'));
    });
  });
});
