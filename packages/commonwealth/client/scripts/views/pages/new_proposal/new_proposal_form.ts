import 'pages/new_proposal_page.scss';

import $ from 'jquery';
import m from 'mithril';
import { utils } from 'ethers';
import {
  Input,
  TextArea,
  Form,
  FormLabel,
  FormGroup,
  Button,
  Grid,
  Col,
  Spinner,
  PopoverMenu,
  Icons,
  MenuItem,
} from 'construct-ui';
import BN from 'bn.js';
import { blake2AsHex } from '@polkadot/util-crypto';
import { Any as ProtobufAny } from 'cosmjs-types/google/protobuf/any';

import app from 'state';
import { ProposalType, ChainBase, ChainNetwork } from 'common-common/src/types';
import { ITXModalData, ProposalModule, ThreadStage, ThreadKind } from 'models';
import { proposalSlugToClass } from 'identifiers';
import { formatCoin } from 'adapters/currency';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import CosmosAccount from 'controllers/chain/cosmos/account';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import { CompoundProposalArgs } from 'controllers/chain/ethereum/compound/governance';

import {
  DropdownFormField,
  RadioSelectorFormField,
} from 'views/components/forms';
import User from 'views/components/widgets/user';
import EdgewareFunctionPicker from 'views/components/edgeware_function_picker';
import { createTXModal } from 'views/modals/tx_signing_modal';
import ErrorPage from 'views/pages/error';
import { AaveProposalArgs } from 'controllers/chain/ethereum/aave/governance';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import NearSputnik from 'controllers/chain/near/sputnik/adapter';
import { navigateToSubpage } from 'app';
import { NearSputnikProposalKind } from 'controllers/chain/near/sputnik/types';
import { TopicSelector } from 'views/components/topic_selector';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';

enum SupportedSputnikProposalTypes {
  AddMemberToRole = 'Add Member',
  RemoveMemberFromRole = 'Remove Member',
  Transfer = 'Payout',
  Vote = 'Poll',
}

enum SupportedCosmosProposalTypes {
  Text = 'Text Proposal',
  CommunitySpend = 'Community Spend',
}

// this should be titled the Substrate/Edgeware new proposal form
const NewProposalForm = {
  form: {},
  oncreate: (vnode) => {
    vnode.state.toggleValue = 'proposal';
  },
  oninit: (vnode) => {
    vnode.state.aaveTabCount = 1;
    vnode.state.activeAaveTabIndex = 0;
    vnode.state.aaveProposalState = [
      {
        target: null,
        value: null,
        calldata: null,
        signature: null,
        withDelegateCall: false,
      },
    ];
    vnode.state.cosmosProposalType = SupportedCosmosProposalTypes.Text;
    vnode.state.sputnikProposalType =
      SupportedSputnikProposalTypes.AddMemberToRole;
  },
  view: (vnode) => {
    const callback = vnode.attrs.callback;
    const author = app.user.activeAccount;
    const proposalTypeEnum = vnode.attrs.typeEnum;

    if (!author) return m('div', 'Must be logged in');
    if (!callback) return m('div', 'Must have callback');
    if (app.chain?.network === ChainNetwork.Plasm)
      return m('div', 'Unsupported network');

    let hasCouncilMotionChooser: boolean;
    let hasAction: boolean;
    let hasToggle: boolean;
    let hasPreimageInput: boolean;
    let hasTitleAndDescription: boolean;
    let hasBountyTitle: boolean;
    let hasTopics: boolean;
    let hasBeneficiary: boolean;
    let hasAmount: boolean;
    let hasPhragmenInfo: boolean;
    let hasDepositChooser: boolean;
    // bounty proposal
    let hasBountyValue: boolean;
    // tip
    let hasTipsFields: boolean;
    // council motion
    let hasVotingPeriodAndDelaySelector: boolean;
    let hasReferendumSelector: boolean;
    let hasExternalProposalSelector: boolean;
    let hasTreasuryProposalSelector: boolean;
    let hasThreshold: boolean;
    // moloch proposal
    let hasMolochFields: boolean;
    // compound proposal
    let hasCompoundFields: boolean;
    // aave proposal
    let hasAaveFields: boolean;
    // sputnik proposal
    let hasSputnikFields: boolean;
    let hasCosmosFields: boolean;
    // data loaded
    let dataLoaded = true;

    if (proposalTypeEnum === ProposalType.SubstrateDemocracyProposal) {
      hasAction = true;
      hasToggle = true;
      hasDepositChooser = vnode.state.toggleValue === 'proposal';
      if (hasDepositChooser) {
        dataLoaded = !!(app.chain as Substrate).democracyProposals?.initialized;
      }
    } else if (proposalTypeEnum === ProposalType.SubstrateCollectiveProposal) {
      hasCouncilMotionChooser = true;
      hasAction =
        vnode.state.councilMotionType === 'createExternalProposal' ||
        vnode.state.councilMotionType === 'createExternalProposalMajority';
      hasVotingPeriodAndDelaySelector =
        vnode.state.councilMotionType === 'createFastTrack' ||
        vnode.state.councilMotionType === 'createExternalProposalDefault';
      hasReferendumSelector =
        vnode.state.councilMotionType === 'createEmergencyCancellation';
      hasExternalProposalSelector =
        vnode.state.councilMotionType === 'vetoNextExternal' ||
        vnode.state.councilMotionType === 'createFastTrack' ||
        vnode.state.councilMotionType === 'createExternalProposalDefault';
      hasTreasuryProposalSelector =
        vnode.state.councilMotionType === 'createTreasuryApprovalMotion' ||
        vnode.state.councilMotionType === 'createTreasuryRejectionMotion';
      hasThreshold = vnode.state.councilMotionType !== 'vetoNextExternal';
      if (hasExternalProposalSelector)
        dataLoaded = !!(app.chain as Substrate).democracyProposals?.initialized;
    } else if (proposalTypeEnum === ProposalType.Thread) {
      hasTitleAndDescription = true;
      hasTopics = true;
    } else if (proposalTypeEnum === ProposalType.SubstrateTreasuryProposal) {
      hasBeneficiary = true;
      hasAmount = true;
      const treasury = (app.chain as Substrate).treasury;
      dataLoaded = !!treasury.initialized;
    } else if (proposalTypeEnum === ProposalType.SubstrateBountyProposal) {
      hasBountyTitle = true;
      hasBountyValue = true;
      const bountyTreasury = (app.chain as Substrate).bounties;
      dataLoaded = !!bountyTreasury.initialized;
    } else if (proposalTypeEnum === ProposalType.SubstrateTreasuryTip) {
      hasTipsFields = true;
      // TODO: this is only true if the proposer is doing reportAwesome()
      //   we need special code for newTip().
      const tips = (app.chain as Substrate).tips;
      dataLoaded = !!tips.initialized;
    } else if (proposalTypeEnum === ProposalType.PhragmenCandidacy) {
      hasPhragmenInfo = true;
      const elections = (app.chain as Substrate).phragmenElections;
      dataLoaded = !!elections.initialized;
    } else if (proposalTypeEnum === ProposalType.CosmosProposal) {
      hasCosmosFields = true;
      dataLoaded = !!(app.chain as Cosmos).governance.initialized;
    } else if (proposalTypeEnum === ProposalType.MolochProposal) {
      hasMolochFields = true;
    } else if (proposalTypeEnum === ProposalType.CompoundProposal) {
      hasCompoundFields = true;
    } else if (proposalTypeEnum === ProposalType.AaveProposal) {
      hasAaveFields = true;
    } else if (proposalTypeEnum === ProposalType.SputnikProposal) {
      hasSputnikFields = true;
    } else {
      return m('.NewProposalForm', 'Invalid proposal type');
    }

    if (
      hasAction &&
      !(app.user.activeAccount as SubstrateAccount).isCouncillor
    ) {
      dataLoaded = false;
    }

    const createNewProposal = () => {
      const done = (result) => {
        vnode.state.error = '';
        callback(result);
        return result;
      };
      let createFunc: (...args) => ITXModalData | Promise<ITXModalData> = (
        a
      ) => {
        return (
          proposalSlugToClass().get(proposalTypeEnum) as ProposalModule<
            any,
            any,
            any
          >
        ).createTx(...a);
      };
      let args = [];
      if (proposalTypeEnum === ProposalType.Thread) {
        app.threads
          .create(
            author.address,
            ThreadKind.Discussion,
            ThreadStage.Discussion,
            app.activeChainId(),
            vnode.state.form.title,
            vnode.state.form.topicName,
            vnode.state.form.topicId,
            vnode.state.form.description
          )
          .then(done)
          .then(() => {
            m.redraw();
          })
          .catch((err) => {
            console.error(err);
          });
        return;
      } else if (proposalTypeEnum === ProposalType.SubstrateDemocracyProposal) {
        const deposit = vnode.state.deposit
          ? app.chain.chain.coins(vnode.state.deposit, true)
          : (app.chain as Substrate).democracyProposals.minimumDeposit;

        if (!EdgewareFunctionPicker.getMethod()) {
          notifyError('Missing arguments');
          return;
        } else if (vnode.state.toggleValue === 'proposal') {
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
            (app.chain as Substrate).democracyProposals.createTx(
              au,
              mt,
              pr,
              dep
            );
        } else if (vnode.state.toggleValue === 'preimage') {
          vnode.attrs.onChangeSlugEnum('democracypreimage');
          const encodedProposal = EdgewareFunctionPicker.getMethod().toHex();
          args = [author, EdgewareFunctionPicker.getMethod(), encodedProposal];
          createFunc = ([au, mt, pr]) =>
            (app.chain as Substrate).democracyProposals.notePreimage(
              au,
              mt,
              pr
            );
        } else if (vnode.state.toggleValue === 'imminent') {
          vnode.attrs.onChangeSlugEnum('democracyimminent');
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
        proposalTypeEnum === ProposalType.SubstrateCollectiveProposal &&
        vnode.state.councilMotionType === 'vetoNextExternal'
      ) {
        args = [author, vnode.state.nextExternalProposalHash];
        createFunc = ([a, h]) =>
          (app.chain as Substrate).council.vetoNextExternal(a, h);
      } else if (
        proposalTypeEnum === ProposalType.SubstrateCollectiveProposal
      ) {
        if (!vnode.state.threshold) throw new Error('Invalid threshold');
        const threshold = vnode.state.threshold;
        if (vnode.state.councilMotionType === 'createExternalProposal') {
          args = [
            author,
            threshold,
            EdgewareFunctionPicker.getMethod(),
            EdgewareFunctionPicker.getMethod().encodedLength,
          ];
          createFunc = ([a, t, mt, l]) =>
            (app.chain as Substrate).council.createExternalProposal(
              a,
              t,
              mt,
              l
            );
        } else if (
          vnode.state.councilMotionType === 'createExternalProposalMajority'
        ) {
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
        } else if (
          vnode.state.councilMotionType === 'createExternalProposalDefault'
        ) {
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
        } else if (vnode.state.councilMotionType === 'createFastTrack') {
          args = [
            author,
            threshold,
            vnode.state.nextExternalProposalHash,
            vnode.state.votingPeriod,
            vnode.state.enactmentDelay,
          ];
          createFunc = ([a, b, c, d, e]) =>
            (app.chain as Substrate).council.createFastTrack(a, b, c, d, e);
        } else if (
          vnode.state.councilMotionType === 'createEmergencyCancellation'
        ) {
          args = [author, threshold, vnode.state.referendumId];
          createFunc = ([a, t, h]) =>
            (app.chain as Substrate).council.createEmergencyCancellation(
              a,
              t,
              h
            );
        } else if (
          vnode.state.councilMotionType === 'createTreasuryApprovalMotion'
        ) {
          args = [author, threshold, vnode.state.treasuryProposalIndex];
          createFunc = ([a, t, i]) =>
            (app.chain as Substrate).council.createTreasuryApprovalMotion(
              a,
              t,
              i
            );
        } else if (
          vnode.state.councilMotionType === 'createTreasuryRejectionMotion'
        ) {
          args = [author, threshold, vnode.state.treasuryProposalIndex];
          createFunc = ([a, t, i]) =>
            (app.chain as Substrate).council.createTreasuryRejectionMotion(
              a,
              t,
              i
            );
        } else {
          throw new Error('Invalid council motion type');
        }

        return createTXModal(createFunc(args)).then(done);
      } else if (proposalTypeEnum === ProposalType.SubstrateTreasuryProposal) {
        if (!vnode.state.form.beneficiary)
          throw new Error('Invalid beneficiary address');
        const beneficiary = app.chain.accounts.get(
          vnode.state.form.beneficiary
        );
        args = [author, vnode.state.form.amount, beneficiary];
      } else if (proposalTypeEnum === ProposalType.SubstrateBountyProposal) {
        if (!vnode.state.form.title) throw new Error('Invalid title');
        if (!vnode.state.form.value) throw new Error('Invalid value');
        args = [author, vnode.state.form.value, vnode.state.form.title];
        createFunc = ([a, v, t]) =>
          (app.chain as Substrate).bounties.createTx(a, v, t);
        return createTXModal(createFunc(args)).then(done);
      } else if (proposalTypeEnum === ProposalType.SubstrateBountyProposal) {
        if (!vnode.state.form.reason) throw new Error('Invalid reason');
        if (!vnode.state.form.beneficiary)
          throw new Error('Invalid beneficiary address');
        const beneficiary = app.chain.accounts.get(
          vnode.state.form.beneficiary
        );
        args = [vnode.state.form.reason, beneficiary];
      } else if (proposalTypeEnum === ProposalType.PhragmenCandidacy) {
        args = [author];
        createFunc = ([a]) =>
          (
            app.chain as Substrate
          ).phragmenElections.activeElection.submitCandidacyTx(a);
      } else if (proposalTypeEnum === ProposalType.CosmosProposal) {
        let prop: ProtobufAny;
        const { title, description } = vnode.state.form;
        const deposit = vnode.state.deposit
          ? new CosmosToken(
              (app.chain as Cosmos).governance.minDeposit.denom,
              vnode.state.deposit,
              false
            )
          : (app.chain as Cosmos).governance.minDeposit;
        if (
          vnode.state.cosmosProposalType === SupportedCosmosProposalTypes.Text
        ) {
          prop = (app.chain as Cosmos).governance.encodeTextProposal(
            title,
            description
          );
        } else if (
          vnode.state.cosmosProposalType ===
          SupportedCosmosProposalTypes.CommunitySpend
        ) {
          prop = (app.chain as Cosmos).governance.encodeCommunitySpend(
            title,
            description,
            vnode.state.recipient,
            vnode.state.payoutAmount
          );
        } else {
          throw new Error('Unknown Cosmos proposal type.');
        }
        // TODO: add disabled / loading
        (app.chain as Cosmos).governance
          .submitProposalTx(author as CosmosAccount, deposit, prop)
          .then((result) => {
            done(result);
            navigateToSubpage(`/proposal/${result}`);
          })
          .catch((err) => notifyError(err.message));
        return;
      } else if (proposalTypeEnum === ProposalType.MolochProposal) {
        // TODO: check that applicant is valid ETH address in hex
        if (!vnode.state.applicantAddress)
          throw new Error('Invalid applicant address');
        if (typeof vnode.state.tokenTribute !== 'number')
          throw new Error('Invalid token tribute');
        if (typeof vnode.state.sharesRequested !== 'number')
          throw new Error('Invalid shares requested');
        if (!vnode.state.title) throw new Error('Invalid title');
        const details = JSON.stringify({
          title: vnode.state.title,
          description: vnode.state.description || '',
        });
        (app.chain as Moloch).governance
          .createPropWebTx(
            author as MolochMember,
            vnode.state.applicantAddress,
            new BN(vnode.state.tokenTribute),
            new BN(vnode.state.sharesRequested),
            details
          )
          // TODO: handling errors?
          .then((result) => done(result))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.data?.message || err.message));
        return;
      } else if (proposalTypeEnum === ProposalType.CompoundProposal) {
        vnode.state.proposer = app.user?.activeAccount?.address;
        if (!vnode.state.proposer)
          throw new Error('Invalid address / not logged in');
        if (!vnode.state.description) throw new Error('Invalid description');

        const targets = [];
        const values = [];
        const calldatas = [];
        const signatures = [];

        for (let i = 0; i < vnode.state.aaveTabCount; i++) {
          const aaveProposal = vnode.state.aaveProposalState[i];
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
        let description = vnode.state.description;
        if (vnode.state.title) {
          description = JSON.stringify({
            description: vnode.state.description,
            title: vnode.state.title,
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
            done(result);
            return result;
          })
          .then((result: string) => {
            notifySuccess(`Proposal ${result} created successfully!`);
            m.redraw();
          })
          .catch((err) => notifyError(err.data?.message || err.message));
        return;
      } else if (proposalTypeEnum === ProposalType.AaveProposal) {
        vnode.state.proposer = app.user?.activeAccount?.address;
        if (!vnode.state.proposer)
          throw new Error('Invalid address / not logged in');
        if (!vnode.state.executor) throw new Error('Invalid executor');
        if (!vnode.state.ipfsHash) throw new Error('No ipfs hash');

        const targets = [];
        const values = [];
        const calldatas = [];
        const signatures = [];
        const withDelegateCalls = [];

        for (let i = 0; i < vnode.state.aaveTabCount; i++) {
          const aaveProposal = vnode.state.aaveProposalState[i];
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
        const ipfsHash = utils.formatBytes32String(vnode.state.ipfsHash);
        const details: AaveProposalArgs = {
          executor: vnode.state.executor as string,
          targets,
          values,
          calldatas,
          signatures,
          withDelegateCalls,
          ipfsHash,
        };
        (app.chain as Aave).governance
          .propose(details)
          .then((result) => done(result))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.data?.message || err.message));
        return;
        // @TODO: Create Proposal via WebTx
      } else if (proposalTypeEnum === ProposalType.SputnikProposal) {
        // TODO: make type of proposal switchable
        const member = vnode.state.member;
        const description = vnode.state.description;
        let propArgs: NearSputnikProposalKind;
        if (
          vnode.state.sputnikProposalType ===
          SupportedSputnikProposalTypes.AddMemberToRole
        ) {
          propArgs = {
            AddMemberToRole: { role: 'council', member_id: member },
          };
        } else if (
          vnode.state.sputnikProposalType ===
          SupportedSputnikProposalTypes.RemoveMemberFromRole
        ) {
          propArgs = {
            RemoveMemberFromRole: { role: 'council', member_id: member },
          };
        } else if (
          vnode.state.sputnikProposalType ===
          SupportedSputnikProposalTypes.Transfer
        ) {
          // TODO: validate amount / token id
          const token_id = vnode.state.tokenId || '';
          let amount: string;
          // treat NEAR as in dollars but tokens as whole #s
          if (!token_id) {
            amount = app.chain.chain
              .coins(+vnode.state.payoutAmount, true)
              .asBN.toString();
          } else {
            amount = `${+vnode.state.payoutAmount}`;
          }
          propArgs = { Transfer: { receiver_id: member, token_id, amount } };
        } else if (
          vnode.state.sputnikProposalType === SupportedSputnikProposalTypes.Vote
        ) {
          propArgs = 'Vote';
        } else {
          throw new Error('unsupported sputnik proposal type');
        }
        (app.chain as NearSputnik).dao
          .proposeTx(description, propArgs)
          .then((result) => done(result))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.message));
        return;
      } else if (proposalTypeEnum === ProposalType.SubstrateTreasuryTip) {
        if (!vnode.state.form.beneficiary)
          throw new Error('Invalid beneficiary address');
        const beneficiary = app.chain.accounts.get(
          vnode.state.form.beneficiary
        );
        args = [author, vnode.state.form.description, beneficiary];
      } else {
        throw new Error('Invalid proposal type');
      }
      Promise.resolve(createFunc(args))
        .then((modalData) => createTXModal(modalData))
        .then(done);
    };

    // default state options
    const motions = SubstrateCollectiveProposal.motions;
    if (!vnode.state.councilMotionType) {
      vnode.state.councilMotionType = motions[0].name;
      vnode.state.councilMotionDescription = motions[0].description;
    }

    // shorthands
    const isSubstrate = app.chain.base === ChainBase.Substrate;
    const asSubstrate = app.chain as Substrate;
    const isCosmos = app.chain.base === ChainBase.CosmosSDK;
    const asCosmos = app.chain as Cosmos;

    if (!dataLoaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return m(ErrorPage, {
          message: 'Could not connect to chain',
          title: 'Proposals',
        });
      }
      return m(Spinner, {
        fill: true,
        message: 'Connecting to chain...',
        size: 'xl',
        style: 'visibility: visible; opacity: 1;',
      });
    }

    const activeEntityInfo = app.chain.meta;

    const { activeAaveTabIndex, aaveProposalState } = vnode.state;

    return m(Form, { class: 'NewProposalForm' }, [
      m(Grid, [
        m(Col, [
          vnode.state.error && m('.error', vnode.state.error.message),
          hasCouncilMotionChooser && [
            m(DropdownFormField, {
              title: 'Motion',
              choices: motions.map((m_) => ({
                name: 'councilMotionType',
                value: m_.name,
                label: m_.label,
              })),
              callback: (result) => {
                vnode.state.councilMotionType = result;
                vnode.state.councilMotionDescription = motions.find(
                  (m_) => m_.name === result
                ).description;
                m.redraw();
              },
            }),
            vnode.state.councilMotionDescription &&
              m(
                '.council-motion-description',
                vnode.state.councilMotionDescription
              ),
          ],
          // actions
          hasAction && m(EdgewareFunctionPicker),
          hasTopics &&
            m(TopicSelector, {
              topics: app.topics.getByCommunity(app.chain.id),
              updateFormData: (topicName: string, topicId?: number) => {
                vnode.state.form.topicName = topicName;
                vnode.state.form.topicId = topicId;
              },
              tabindex: 3,
            }),
          hasBountyTitle && [
            m(FormGroup, [
              m(FormLabel, 'Title'),
              m(Input, {
                placeholder: 'Bounty title (stored on chain)',
                name: 'title',
                autofocus: true,
                autocomplete: 'off',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.title = result;
                  m.redraw();
                },
              }),
            ]),
          ],
          hasTitleAndDescription && [
            m(FormGroup, [
              m(FormLabel, 'Title'),
              m(Input, {
                placeholder: 'Enter a title',
                name: 'title',
                autofocus: true,
                autocomplete: 'off',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.title = result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Description'),
              m(TextArea, {
                name: 'description',
                placeholder: 'Enter a description',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  if (vnode.state.form.description === result) return;
                  vnode.state.form.description = result;
                  m.redraw();
                },
              }),
            ]),
          ],
          hasBeneficiary && [
            m(FormGroup, [
              m(FormLabel, 'Beneficiary'),
              m(Input, {
                name: 'beneficiary',
                placeholder: 'Beneficiary of proposal',
                defaultValue: author.address,
                oncreate: (vvnode) => {
                  vnode.state.form.beneficiary = author.address;
                },
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.beneficiary = result;
                  m.redraw();
                },
              }),
            ]),
          ],
          hasAmount && [
            m(FormGroup, [
              m(FormLabel, `Amount (${app.chain.chain.denom})`),
              m(Input, {
                name: 'amount',
                autofocus: true,
                placeholder: 'Amount of proposal',
                autocomplete: 'off',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.amount = app.chain.chain.coins(
                    parseFloat(result),
                    true
                  );
                  m.redraw();
                },
              }),
            ]),
            m('p', [
              'Bond: ',
              app.chain.chain
                .coins(
                  Math.max(
                    (vnode.state.form.amount?.inDollars || 0) *
                      (app.chain as Substrate).treasury.bondPct,
                    (app.chain as Substrate).treasury.bondMinimum.inDollars
                  ),
                  true
                )
                .format(),
              ` (${
                (app.chain as Substrate).treasury.bondPct * 100
              }% of requested amount, `,
              `minimum ${(
                app.chain as Substrate
              ).treasury.bondMinimum.format()})`,
            ]),
          ],
          hasPhragmenInfo &&
            m('.council-slot-info', [
              m('p', [
                'Becoming a candidate requires a deposit of ',
                formatCoin(
                  (app.chain as Substrate).phragmenElections.candidacyBond
                ),
                '. It will be returned if you are elected, or carried over to the next election if you are in the top ',
                `${
                  (app.chain as Substrate).phragmenElections.desiredRunnersUp
                } runners-up.`,
              ]),
            ]),
          hasToggle && [
            m(RadioSelectorFormField, {
              callback: async (value) => {
                vnode.state.toggleValue = value;
                vnode.attrs.onChangeSlugEnum(value);
                m.redraw();
              },
              choices: [
                { label: 'Create Proposal', value: 'proposal', checked: true },
                { label: 'Upload Preimage', value: 'preimage', checked: false },
                {
                  label: 'Upload Imminent Preimage',
                  value: 'imminent',
                  checked: false,
                },
              ],
              name: 'democracy-tx-switcher',
            }),
          ],
          hasBountyValue && [
            m(FormGroup, [
              m(FormLabel, `Value (${app.chain.chain.denom})`),
              m(Input, {
                name: 'value',
                placeholder: 'Amount allocated to bounty',
                autocomplete: 'off',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.value = app.chain.chain.coins(
                    parseFloat(result),
                    true
                  );
                  m.redraw();
                },
              }),
            ]),
          ],
          hasDepositChooser && [
            m(FormGroup, [
              m(
                FormLabel,
                `Deposit (${
                  app.chain.base === ChainBase.Substrate
                    ? app.chain.currency
                    : (app.chain as Cosmos).governance.minDeposit.denom
                })`
              ),
              m(Input, {
                name: 'deposit',
                placeholder: `Min: ${
                  app.chain.base === ChainBase.Substrate
                    ? (app.chain as Substrate).democracyProposals.minimumDeposit
                        .inDollars
                    : +(app.chain as Cosmos).governance.minDeposit
                }`,
                oncreate: (vvnode) =>
                  $(vvnode.dom).val(
                    app.chain.base === ChainBase.Substrate
                      ? (app.chain as Substrate).democracyProposals
                          .minimumDeposit.inDollars
                      : +(app.chain as Cosmos).governance.minDeposit
                  ),
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.deposit = parseFloat(result);
                  m.redraw();
                },
              }),
            ]),
          ],
          hasVotingPeriodAndDelaySelector && [
            m(FormGroup, [
              m(FormLabel, 'Voting Period'),
              m(Input, {
                name: 'voting_period',
                placeholder: 'Blocks (minimum enforced)',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.votingPeriod = +result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Enactment Delay'),
              m(Input, {
                name: 'enactment_delay',
                placeholder: 'Blocks (minimum enforced)',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.enactmentDelay = +result;
                  m.redraw();
                },
              }),
            ]),
          ],
          hasReferendumSelector &&
            m(DropdownFormField, {
              title: 'Referendum',
              choices: (app.chain as Substrate).democracy.store
                .getAll()
                .map((r) => ({
                  name: 'referendum',
                  value: r.identifier,
                  label: `${r.shortIdentifier}: ${r.title}`,
                })),
              callback: (result) => {
                vnode.state.referendumId = result;
                m.redraw();
              },
            }),
          hasExternalProposalSelector &&
            m(DropdownFormField, {
              title: 'Proposal',
              choices: (app.chain as Substrate).democracyProposals.nextExternal
                ? [
                    {
                      name: 'external_proposal',
                      value: (
                        app.chain as Substrate
                      ).democracyProposals.nextExternal[0].hash.toString(),
                      label: `${(
                        app.chain as Substrate
                      ).democracyProposals.nextExternal[0].hash
                        .toString()
                        .slice(0, 8)}...`,
                    },
                  ]
                : [],
              callback: (result) => {
                vnode.state.nextExternalProposalHash = result;
                m.redraw();
              },
            }),
          hasTreasuryProposalSelector &&
            m(DropdownFormField, {
              title: 'Treasury Proposal',
              choices: (app.chain as Substrate).treasury.store
                .getAll()
                .map((r) => ({
                  name: 'external_proposal',
                  value: r.identifier,
                  label: r.shortIdentifier,
                })),
              callback: (result) => {
                vnode.state.treasuryProposalIndex = result;
                m.redraw();
              },
            }),
          hasThreshold && [
            m(FormGroup, [
              m(FormLabel, 'Threshold'),
              m(Input, {
                name: 'threshold',
                placeholder: 'How many members must vote yes to execute?',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.threshold = +result;
                  m.redraw();
                },
              }),
            ]),
          ],
          hasMolochFields && [
            m(FormGroup, [
              m(FormLabel, 'Applicant Address (will receive Moloch shares)'),
              m(Input, {
                name: 'applicant_address',
                placeholder: 'Applicant Address',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.applicantAddress = result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(
                FormLabel,
                'Token Tribute (offered to Moloch, must be pre-approved for transfer)'
              ),
              m(Input, {
                name: 'token_tribute',
                placeholder: 'Tribute in tokens',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.tokenTribute = +result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Shares Requested'),
              m(Input, {
                name: 'shares_requested',
                placeholder: 'Moloch shares requested',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.sharesRequested = +result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Proposal Title'),
              m(Input, {
                name: 'title',
                placeholder: 'Proposal Title',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.title = result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Proposal Description'),
              m(Input, {
                name: 'description',
                placeholder: 'Proposal Description',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.description = result;
                  m.redraw();
                },
              }),
            ]),
          ],

          hasCompoundFields &&
            m('.AaveGovernance', [
              m(FormGroup, [
                m(FormLabel, 'Proposer (you)'),
                m('', [
                  m(User, {
                    user: author,
                    linkify: true,
                    popover: true,
                    showAddressWithDisplayName: true,
                  }),
                ]),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Proposal Title (leave blank for no title)'),
                m(Input, {
                  name: 'title',
                  placeholder: 'Proposal Title',
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.title = result;
                    m.redraw();
                  },
                }),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Proposal Description'),
                m(TextArea, {
                  name: 'description',
                  placeholder: 'Proposal Description',
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.description = result;
                    m.redraw();
                  },
                }),
              ]),
              m('.tab-selector', [
                m(CWTabBar, [
                  aaveProposalState.map((_, index) =>
                    m(CWTab, {
                      label: `Call ${index + 1}`,
                      isSelected: activeAaveTabIndex === index,
                      onclick: () => {
                        vnode.state.activeAaveTabIndex = index;
                      },
                    })
                  ),
                ]),
                m(PopoverMenu, {
                  closeOnContentClick: true,
                  content: [
                    m(MenuItem, {
                      iconLeft: Icons.EDIT_2,
                      label: 'Add',
                      onclick: () => {
                        vnode.state.aaveTabCount++;
                        vnode.state.activeAaveTabIndex =
                          vnode.state.aaveTabCount - 1;
                        vnode.state.aaveProposalState.push({
                          target: null,
                          value: null,
                          calldata: null,
                          signature: null,
                          withDelegateCall: false,
                        });
                      },
                    }),
                    m(MenuItem, {
                      iconLeft: Icons.TRASH_2,
                      label: 'Delete',
                      disabled: vnode.state.activeAaveTabIndex === 0,
                      onclick: () => {
                        vnode.state.aaveTabCount--;
                        vnode.state.activeAaveTabIndex =
                          vnode.state.aaveTabCount - 1;
                        vnode.state.aaveProposalState.pop();
                      },
                    }),
                  ],
                  trigger: m(Button, {
                    iconLeft: Icons.MORE_HORIZONTAL,
                    basic: true,
                  }),
                }),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Target Address'),
                m(Input, {
                  name: 'targets',
                  placeholder: 'Add Target',
                  value: aaveProposalState[activeAaveTabIndex].target,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.aaveProposalState[activeAaveTabIndex].target =
                      result;
                    m.redraw();
                  },
                }),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Value'),
                m(Input, {
                  name: 'values',
                  placeholder: 'Enter amount in wei',
                  value: aaveProposalState[activeAaveTabIndex].value,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.aaveProposalState[activeAaveTabIndex].value =
                      result;
                    m.redraw();
                  },
                }),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Calldata'),
                m(Input, {
                  name: 'calldatas',
                  placeholder: 'Add Calldata',
                  value: aaveProposalState[activeAaveTabIndex].calldata,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.aaveProposalState[activeAaveTabIndex].calldata =
                      result;
                    m.redraw();
                  },
                }),
              ]),
              m(FormGroup, [
                m('.flex-label', [
                  m(FormLabel, 'Function Signature'),
                  m('.helper-text', 'Optional'),
                ]),
                m(Input, {
                  name: 'signatures',
                  placeholder: 'Add a signature',
                  value: aaveProposalState[activeAaveTabIndex].signature,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.aaveProposalState[
                      activeAaveTabIndex
                    ].signature = result;
                    m.redraw();
                  },
                }),
              ]),
            ]),
          hasAaveFields &&
            m('.AaveGovernance', [
              m(FormGroup, [
                m(FormLabel, 'Proposer (you)'),
                m('', [
                  m(User, {
                    user: author,
                    linkify: true,
                    popover: true,
                    showAddressWithDisplayName: true,
                  }),
                ]),
              ]),
              // TODO: validate this is the correct length, or else hash it ourselves
              m(FormGroup, [
                m(FormLabel, 'IPFS Hash'),
                m(Input, {
                  name: 'ipfsHash',
                  placeholder: 'Proposal IPFS Hash',
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.ipfsHash = result;
                    m.redraw();
                  },
                }),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Executor'),
                (app.chain as Aave).governance.api.Executors.map((r) =>
                  m(
                    `.executor ${
                      vnode.state.executor === r.address && '.selected-executor'
                    }`,
                    {
                      onclick: () => {
                        vnode.state.executor = r.address;
                      },
                    },
                    [
                      m('.label', 'Address'),
                      m('', r.address),
                      m('.label .mt-16', 'Time Delay'),
                      m('', `${r.delay / (60 * 60 * 24)} Day(s)`),
                    ]
                  )
                ),
              ]),
              // TODO: display copy re AIPs and ARCs from https://docs.aave.com/governance/
              m('.tab-selector', [
                m(CWTabBar, [
                  aaveProposalState.map((_, index) =>
                    m(CWTab, {
                      label: `Call ${index + 1}`,
                      isSelected: activeAaveTabIndex === index,
                      onclick: () => {
                        vnode.state.activeAaveTabIndex = index;
                      },
                    })
                  ),
                ]),
                m(PopoverMenu, {
                  closeOnContentClick: true,
                  content: [
                    m(MenuItem, {
                      iconLeft: Icons.EDIT_2,
                      label: 'Add',
                      onclick: () => {
                        vnode.state.aaveTabCount++;
                        vnode.state.activeAaveTabIndex =
                          vnode.state.aaveTabCount - 1;
                        vnode.state.aaveProposalState.push({
                          target: null,
                          value: null,
                          calldata: null,
                          signature: null,
                          withDelegateCall: false,
                        });
                      },
                    }),
                    m(MenuItem, {
                      iconLeft: Icons.TRASH_2,
                      label: 'Delete',
                      disabled: vnode.state.activeAaveTabIndex === 0,
                      onclick: () => {
                        vnode.state.aaveTabCount--;
                        vnode.state.activeAaveTabIndex =
                          vnode.state.aaveTabCount - 1;
                        vnode.state.aaveProposalState.pop();
                      },
                    }),
                  ],
                  trigger: m(Button, {
                    iconLeft: Icons.MORE_HORIZONTAL,
                    basic: true,
                  }),
                }),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Target Address'),
                m(Input, {
                  name: 'targets',
                  placeholder: 'Add Target',
                  value: aaveProposalState[activeAaveTabIndex].target,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.aaveProposalState[activeAaveTabIndex].target =
                      result;
                    m.redraw();
                  },
                }),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Value'),
                m(Input, {
                  name: 'values',
                  placeholder: 'Enter amount in wei',
                  value: aaveProposalState[activeAaveTabIndex].value,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.aaveProposalState[activeAaveTabIndex].value =
                      result;
                    m.redraw();
                  },
                }),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Calldata'),
                m(Input, {
                  name: 'calldatas',
                  placeholder: 'Add Calldata',
                  value: aaveProposalState[activeAaveTabIndex].calldata,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.aaveProposalState[activeAaveTabIndex].calldata =
                      result;
                    m.redraw();
                  },
                }),
              ]),
              m(FormGroup, [
                m('.flex-label', [
                  m(FormLabel, 'Function Signature'),
                  m('.helper-text', 'Optional'),
                ]),
                m(Input, {
                  name: 'signatures',
                  placeholder: 'Add a signature',
                  value: aaveProposalState[activeAaveTabIndex].signature,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.aaveProposalState[
                      activeAaveTabIndex
                    ].signature = result;
                    m.redraw();
                  },
                }),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Delegate Call'),
                m('', [
                  m(Button, {
                    label: 'TRUE',
                    class: `button ${
                      aaveProposalState[activeAaveTabIndex].withDelegateCall ===
                        true && 'active'
                    }`,
                    onclick: () => {
                      vnode.state.aaveProposalState[
                        activeAaveTabIndex
                      ].withDelegateCall = true;
                    },
                  }),
                  m(Button, {
                    label: 'FALSE',
                    class: `ml-12 button ${
                      aaveProposalState[activeAaveTabIndex].withDelegateCall ===
                        false && 'active'
                    }`,
                    onclick: () => {
                      vnode.state.aaveProposalState[
                        activeAaveTabIndex
                      ].withDelegateCall = false;
                    },
                  }),
                ]),
              ]),
            ]),
          hasSputnikFields && [
            // TODO: add deposit copy
            m(DropdownFormField, {
              title: 'Proposal Type',
              value: vnode.state.sputnikProposalType,
              defaultValue: SupportedSputnikProposalTypes.AddMemberToRole,
              choices: Object.values(SupportedSputnikProposalTypes).map(
                (v) => ({
                  name: 'proposalType',
                  label: v,
                  value: v,
                })
              ),
              callback: (result) => {
                vnode.state.sputnikProposalType = result;
                m.redraw();
              },
            }),
            m(FormGroup, [
              vnode.state.sputnikProposalType !==
                SupportedSputnikProposalTypes.Vote && m(FormLabel, 'Member'),
              vnode.state.sputnikProposalType !==
                SupportedSputnikProposalTypes.Vote &&
                m(Input, {
                  name: 'member',
                  defaultValue: 'tokenfactory.testnet',
                  oncreate: (vvnode) => {
                    vnode.state.member = 'tokenfactory.testnet';
                  },
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.member = result;
                    m.redraw();
                  },
                }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Description'),
              m(Input, {
                name: 'description',
                defaultValue: '',
                oncreate: (vvnode) => {
                  vnode.state.description = '';
                },
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.description = result;
                  m.redraw();
                },
              }),
            ]),
            vnode.state.sputnikProposalType ===
              SupportedSputnikProposalTypes.Transfer &&
              m(FormGroup, [
                m(FormLabel, 'Token ID (leave blank for Ⓝ)'),
                m(Input, {
                  name: 'token_id',
                  defaultValue: '',
                  oncreate: (vvnode) => {
                    vnode.state.tokenId = '';
                  },
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.tokenId = result;
                    m.redraw();
                  },
                }),
              ]),
            vnode.state.sputnikProposalType ===
              SupportedSputnikProposalTypes.Transfer &&
              m(FormGroup, [
                m(FormLabel, 'Amount'),
                m(Input, {
                  name: 'amount',
                  defaultValue: '',
                  oncreate: (vvnode) => {
                    vnode.state.payoutAmount = '';
                  },
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.payoutAmount = result;
                    m.redraw();
                  },
                }),
              ]),
          ],
          hasCosmosFields && [
            m(DropdownFormField, {
              title: 'Proposal Type',
              value: vnode.state.cosmosProposalType,
              defaultValue: SupportedCosmosProposalTypes.Text,
              choices: Object.values(SupportedCosmosProposalTypes).map((v) => ({
                name: 'proposalType',
                label: v,
                value: v,
              })),
              callback: (result) => {
                vnode.state.cosmosProposalType = result;
                m.redraw();
              },
            }),
            m(FormGroup, [
              m(FormLabel, 'Title'),
              m(Input, {
                placeholder: 'Enter a title',
                name: 'title',
                autofocus: true,
                autocomplete: 'off',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.title = result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Description'),
              m(TextArea, {
                name: 'description',
                placeholder: 'Enter a description',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  if (vnode.state.form.description === result) return;
                  vnode.state.form.description = result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(
                FormLabel,
                `Deposit (${(app.chain as Cosmos).governance.minDeposit.denom})`
              ),
              m(Input, {
                name: 'deposit',
                placeholder: `Min: ${+(app.chain as Cosmos).governance
                  .minDeposit}`,
                oncreate: (vvnode) =>
                  $(vvnode.dom).val(
                    +(app.chain as Cosmos).governance.minDeposit
                  ),
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.deposit = +result;
                  m.redraw();
                },
              }),
            ]),
            vnode.state.cosmosProposalType !==
              SupportedCosmosProposalTypes.Text &&
              m(FormGroup, [
                m(FormLabel, 'Recipient'),
                m(Input, {
                  name: 'recipient',
                  placeholder: app.user.activeAccount.address,
                  defaultValue: '',
                  oncreate: (vvnode) => {
                    vnode.state.recipient = '';
                  },
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.recipient = result;
                    m.redraw();
                  },
                }),
              ]),
            vnode.state.cosmosProposalType !==
              SupportedCosmosProposalTypes.Text &&
              m(FormGroup, [
                m(
                  FormLabel,
                  `Amount (${
                    (app.chain as Cosmos).governance.minDeposit.denom
                  })`
                ),
                m(Input, {
                  name: 'amount',
                  placeholder: '12345',
                  defaultValue: '',
                  oncreate: (vvnode) => {
                    vnode.state.payoutAmount = '';
                  },
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.payoutAmount = result;
                    m.redraw();
                  },
                }),
              ]),
          ],
          hasTipsFields && [
            m(FormGroup, [
              m('.label', 'Finder'),
              m(User, {
                user: author,
                linkify: true,
                popover: true,
                showAddressWithDisplayName: true,
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Beneficiary'),
              m(Input, {
                name: 'beneficiary',
                placeholder: 'Beneficiary of treasury proposal',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.beneficiary = result;
                  m.redraw();
                },
              }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Reason'),
              m(TextArea, {
                name: 'reason',
                placeholder:
                  'What’s the reason you want to tip the beneficiary?',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  if (vnode.state.form.description === result) return;
                  vnode.state.form.description = result;
                  m.redraw();
                },
              }),
            ]),
          ],
          m(FormGroup, [
            m(Button, {
              disabled:
                proposalTypeEnum === ProposalType.SubstrateCollectiveProposal &&
                !(author as SubstrateAccount).isCouncillor,
              intent: 'primary',
              rounded: true,
              label:
                proposalTypeEnum === ProposalType.Thread
                  ? 'Create thread'
                  : 'Send transaction',
              onclick: (e) => {
                e.preventDefault();
                createNewProposal();
              },
              tabindex: 4,
              type: 'submit',
            }),
          ]),
        ]),
      ]),
    ]);
  },
};

export default NewProposalForm;
