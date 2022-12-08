/* @jsx m */

import m from 'mithril';
import { utils } from 'ethers';
import BN from 'bn.js';
import { blake2AsHex } from '@polkadot/util-crypto';
import { Any as ProtobufAny } from 'cosmjs-types/google/protobuf/any';

import app from 'state';
import { ProposalType } from 'common-common/src/types';
import { ITXModalData, ProposalModule, ThreadStage, ThreadKind } from 'models';
import { proposalSlugToClass } from 'identifiers';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import CosmosAccount from 'controllers/chain/cosmos/account';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import Substrate from 'controllers/chain/substrate/adapter';
import Cosmos from 'controllers/chain/cosmos/adapter';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import { CompoundProposalArgs } from 'controllers/chain/ethereum/compound/governance';
import EdgewareFunctionPicker from 'views/components/edgeware_function_picker';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { AaveProposalArgs } from 'controllers/chain/ethereum/aave/governance';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import NearSputnik from 'controllers/chain/near/sputnik/adapter';
import { navigateToSubpage } from 'app';
import { NearSputnikProposalKind } from 'controllers/chain/near/sputnik/types';
import {
  SupportedCosmosProposalTypes,
  SupportedSputnikProposalTypes,
} from './types';

export const createNewProposal = (
  state,
  typeEnum: ProposalType,
  author,
  onChangeSlugEnum
) => {
  let createFunc: (...args) => ITXModalData | Promise<ITXModalData> = (a) => {
    return (
      proposalSlugToClass().get(typeEnum) as ProposalModule<any, any, any>
    ).createTx(...a);
  };

  let args = [];

  if (typeEnum === ProposalType.Thread) {
    app.threads
      .create(
        author.address,
        ThreadKind.Discussion,
        ThreadStage.Discussion,
        app.activeChainId(),
        state.form.title,
        state.form.topicName,
        state.form.topicId,
        state.form.description
      )
      .then(() => {
        m.redraw();
      })
      .catch((err) => {
        console.error(err);
      });
    return;
  } else if (typeEnum === ProposalType.SubstrateDemocracyProposal) {
    const deposit = state.deposit
      ? app.chain.chain.coins(state.deposit, true)
      : (app.chain as Substrate).democracyProposals.minimumDeposit;

    if (!EdgewareFunctionPicker.getMethod()) {
      notifyError('Missing arguments');
      return;
    } else if (state.toggleValue === 'proposal') {
      const proposalHash = blake2AsHex(
        EdgewareFunctionPicker.getMethod().toHex()
      );

      args = [
        author,
        EdgewareFunctionPicker.getMethod(),
        proposalHash,
        deposit,
      ];

      createFunc = ([au, mt, pr, dep]) =>
        (app.chain as Substrate).democracyProposals.createTx(au, mt, pr, dep);
    } else if (state.toggleValue === 'preimage') {
      onChangeSlugEnum('democracypreimage');

      const encodedProposal = EdgewareFunctionPicker.getMethod().toHex();

      args = [author, EdgewareFunctionPicker.getMethod(), encodedProposal];

      createFunc = ([au, mt, pr]) =>
        (app.chain as Substrate).democracyProposals.notePreimage(au, mt, pr);
    } else if (state.toggleValue === 'imminent') {
      onChangeSlugEnum('democracyimminent');

      const encodedProposal = EdgewareFunctionPicker.getMethod().toHex();

      args = [author, EdgewareFunctionPicker.getMethod(), encodedProposal];

      createFunc = ([au, mt, pr]) =>
        (app.chain as Substrate).democracyProposals.noteImminentPreimage(
          au,
          mt,
          pr
        );
    } else {
      throw new Error('Invalid toggle state');
    }
  } else if (
    typeEnum === ProposalType.SubstrateCollectiveProposal &&
    state.councilMotionType === 'vetoNextExternal'
  ) {
    args = [author, state.nextExternalProposalHash];

    createFunc = ([a, h]) =>
      (app.chain as Substrate).council.vetoNextExternal(a, h);
  } else if (typeEnum === ProposalType.SubstrateCollectiveProposal) {
    if (!state.threshold) throw new Error('Invalid threshold');

    const threshold = state.threshold;

    if (state.councilMotionType === 'createExternalProposal') {
      args = [
        author,
        threshold,
        EdgewareFunctionPicker.getMethod(),
        EdgewareFunctionPicker.getMethod().encodedLength,
      ];

      createFunc = ([a, t, mt, l]) =>
        (app.chain as Substrate).council.createExternalProposal(a, t, mt, l);
    } else if (state.councilMotionType === 'createExternalProposalMajority') {
      args = [
        author,
        threshold,
        EdgewareFunctionPicker.getMethod(),
        EdgewareFunctionPicker.getMethod().encodedLength,
      ];

      createFunc = ([a, t, mt, l]) =>
        (app.chain as Substrate).council.createExternalProposalMajority(
          a,
          t,
          mt,
          l
        );
    } else if (state.councilMotionType === 'createExternalProposalDefault') {
      args = [
        author,
        threshold,
        EdgewareFunctionPicker.getMethod(),
        EdgewareFunctionPicker.getMethod().encodedLength,
      ];

      createFunc = ([a, t, mt, l]) =>
        (app.chain as Substrate).council.createExternalProposalDefault(
          a,
          t,
          mt,
          l
        );
    } else if (state.councilMotionType === 'createFastTrack') {
      args = [
        author,
        threshold,
        state.nextExternalProposalHash,
        state.votingPeriod,
        state.enactmentDelay,
      ];

      createFunc = ([a, b, c, d, e]) =>
        (app.chain as Substrate).council.createFastTrack(a, b, c, d, e);
    } else if (state.councilMotionType === 'createEmergencyCancellation') {
      args = [author, threshold, state.referendumId];

      createFunc = ([a, t, h]) =>
        (app.chain as Substrate).council.createEmergencyCancellation(a, t, h);
    } else if (state.councilMotionType === 'createTreasuryApprovalMotion') {
      args = [author, threshold, state.treasuryProposalIndex];

      createFunc = ([a, t, i]) =>
        (app.chain as Substrate).council.createTreasuryApprovalMotion(a, t, i);
    } else if (state.councilMotionType === 'createTreasuryRejectionMotion') {
      args = [author, threshold, state.treasuryProposalIndex];

      createFunc = ([a, t, i]) =>
        (app.chain as Substrate).council.createTreasuryRejectionMotion(a, t, i);
    } else {
      throw new Error('Invalid council motion type');
    }

    return createTXModal(createFunc(args));
  } else if (typeEnum === ProposalType.SubstrateTreasuryProposal) {
    if (!state.form.beneficiary) {
      throw new Error('Invalid beneficiary address');
    }

    const beneficiary = app.chain.accounts.get(state.form.beneficiary);

    args = [author, state.form.amount, beneficiary];
  } else if (typeEnum === ProposalType.SubstrateBountyProposal) {
    if (!state.form.title) {
      throw new Error('Invalid title');
    }

    if (!state.form.value) {
      throw new Error('Invalid value');
    }

    if (!state.form.reason) {
      throw new Error('Invalid reason');
    }

    if (!state.form.beneficiary) {
      throw new Error('Invalid beneficiary address');
    }

    const beneficiary = app.chain.accounts.get(state.form.beneficiary);

    args = [
      state.form.reason,
      beneficiary,
      author,
      state.form.value,
      state.form.title,
    ];

    createFunc = ([a, v, t]) =>
      (app.chain as Substrate).bounties.createTx(a, v, t);
    return createTXModal(createFunc(args));
  } else if (typeEnum === ProposalType.PhragmenCandidacy) {
    args = [author];

    createFunc = ([a]) =>
      (
        app.chain as Substrate
      ).phragmenElections.activeElection.submitCandidacyTx(a);
  } else if (typeEnum === ProposalType.CosmosProposal) {
    let prop: ProtobufAny;

    const { title, description } = state.form;

    const deposit = state.deposit
      ? new CosmosToken(
          (app.chain as Cosmos).governance.minDeposit.denom,
          state.deposit,
          false
        )
      : (app.chain as Cosmos).governance.minDeposit;
    if (state.cosmosProposalType === SupportedCosmosProposalTypes.Text) {
      prop = (app.chain as Cosmos).governance.encodeTextProposal(
        title,
        description
      );
    } else if (
      state.cosmosProposalType === SupportedCosmosProposalTypes.CommunitySpend
    ) {
      prop = (app.chain as Cosmos).governance.encodeCommunitySpend(
        title,
        description,
        state.recipient,
        state.payoutAmount
      );
    } else {
      throw new Error('Unknown Cosmos proposal type.');
    }
    // TODO: add disabled / loading
    (app.chain as Cosmos).governance
      .submitProposalTx(author as CosmosAccount, deposit, prop)
      .then((result) => {
        navigateToSubpage(`/proposal/${result}`);
      })
      .catch((err) => notifyError(err.message));
    return;
  } else if (typeEnum === ProposalType.MolochProposal) {
    // TODO: check that applicant is valid ETH address in hex
    if (!state.applicantAddress) {
      throw new Error('Invalid applicant address');
    }

    if (typeof state.tokenTribute !== 'number') {
      throw new Error('Invalid token tribute');
    }

    if (typeof state.sharesRequested !== 'number') {
      throw new Error('Invalid shares requested');
    }

    if (!state.title) {
      throw new Error('Invalid title');
    }

    const details = JSON.stringify({
      title: state.title,
      description: state.description || '',
    });

    (app.chain as Moloch).governance
      .createPropWebTx(
        author as MolochMember,
        state.applicantAddress,
        new BN(state.tokenTribute),
        new BN(state.sharesRequested),
        details
      )
      // TODO: handling errors?
      .then(() => m.redraw())
      .catch((err) => notifyError(err.data?.message || err.message));
    return;
  } else if (typeEnum === ProposalType.CompoundProposal) {
    state.proposer = app.user?.activeAccount?.address;

    if (!state.proposer) {
      throw new Error('Invalid address / not logged in');
    }

    if (!state.description) {
      throw new Error('Invalid description');
    }

    const targets = [];
    const values = [];
    const calldatas = [];
    const signatures = [];

    for (let i = 0; i < state.aaveTabCount; i++) {
      const aaveProposal = state.aaveProposalState[i];
      if (aaveProposal.target) {
        targets.push(aaveProposal.target);
      } else {
        throw new Error(`No target for Call ${i + 1}`);
      }

      values.push(aaveProposal.value || '0');
      calldatas.push(aaveProposal.calldata || '');
      signatures.push(aaveProposal.signature || '');
    }

    // if they passed a title, use the JSON format for description.
    // otherwise, keep description raw
    let description = state.description;

    if (state.title) {
      description = JSON.stringify({
        description: state.description,
        title: state.title,
      });
    }

    const details: CompoundProposalArgs = {
      description,
      targets,
      values,
      calldatas,
      signatures,
    };

    (app.chain as Compound).governance
      .propose(details)
      .then((result: string) => {
        notifySuccess(`Proposal ${result} created successfully!`);
        m.redraw();
      })
      .catch((err) => notifyError(err.data?.message || err.message));

    return;
  } else if (typeEnum === ProposalType.AaveProposal) {
    state.proposer = app.user?.activeAccount?.address;

    if (!state.proposer) {
      throw new Error('Invalid address / not logged in');
    }

    if (!state.executor) {
      throw new Error('Invalid executor');
    }

    if (!state.ipfsHash) {
      throw new Error('No ipfs hash');
    }

    const targets = [];
    const values = [];
    const calldatas = [];
    const signatures = [];
    const withDelegateCalls = [];

    for (let i = 0; i < state.aaveTabCount; i++) {
      const aaveProposal = state.aaveProposalState[i];

      if (aaveProposal.target) {
        targets.push(aaveProposal.target);
      } else {
        throw new Error(`No target for Call ${i + 1}`);
      }

      values.push(aaveProposal.value || '0');
      calldatas.push(aaveProposal.calldata || '');
      withDelegateCalls.push(aaveProposal.withDelegateCall || false);
      signatures.push(aaveProposal.signature || '');
    }

    // TODO: preload this ipfs value to ensure it's correct
    const ipfsHash = utils.formatBytes32String(state.ipfsHash);

    const details: AaveProposalArgs = {
      executor: state.executor as string,
      targets,
      values,
      calldatas,
      signatures,
      withDelegateCalls,
      ipfsHash,
    };

    (app.chain as Aave).governance
      .propose(details)
      .then(() => m.redraw())
      .catch((err) => notifyError(err.data?.message || err.message));

    return;
    // @TODO: Create Proposal via WebTx
  } else if (typeEnum === ProposalType.SputnikProposal) {
    // TODO: make type of proposal switchable
    const member = state.member;

    const description = state.description;

    let propArgs: NearSputnikProposalKind;

    if (
      state.sputnikProposalType ===
      SupportedSputnikProposalTypes.AddMemberToRole
    ) {
      propArgs = {
        AddMemberToRole: { role: 'council', member_id: member },
      };
    } else if (
      state.sputnikProposalType ===
      SupportedSputnikProposalTypes.RemoveMemberFromRole
    ) {
      propArgs = {
        RemoveMemberFromRole: { role: 'council', member_id: member },
      };
    } else if (
      state.sputnikProposalType === SupportedSputnikProposalTypes.Transfer
    ) {
      // TODO: validate amount / token id
      const token_id = state.tokenId || '';

      let amount: string;
      // treat NEAR as in dollars but tokens as whole #s
      if (!token_id) {
        amount = app.chain.chain
          .coins(+state.payoutAmount, true)
          .asBN.toString();
      } else {
        amount = `${+state.payoutAmount}`;
      }

      propArgs = { Transfer: { receiver_id: member, token_id, amount } };
    } else if (
      state.sputnikProposalType === SupportedSputnikProposalTypes.Vote
    ) {
      propArgs = 'Vote';
    } else {
      throw new Error('unsupported sputnik proposal type');
    }
    (app.chain as NearSputnik).dao
      .proposeTx(description, propArgs)
      .then(() => m.redraw())
      .catch((err) => notifyError(err.message));

    return;
  } else if (typeEnum === ProposalType.SubstrateTreasuryTip) {
    if (!state.form.beneficiary) {
      throw new Error('Invalid beneficiary address');
    }

    const beneficiary = app.chain.accounts.get(state.form.beneficiary);

    args = [author, state.form.description, beneficiary];
  } else {
    throw new Error('Invalid proposal type');
  }
  Promise.resolve(createFunc(args)).then((modalData) =>
    createTXModal(modalData)
  );
};
