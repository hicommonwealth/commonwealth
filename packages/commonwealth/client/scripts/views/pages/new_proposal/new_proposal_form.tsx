/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';
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
  PopoverMenu,
  Icons,
  MenuItem,
} from 'construct-ui';
import BN from 'bn.js';
import { blake2AsHex } from '@polkadot/util-crypto';
import { Any as ProtobufAny } from 'cosmjs-types/google/protobuf/any';

import 'pages/new_proposal_page.scss';

import app from 'state';
import { ProposalType, ChainBase, ChainNetwork } from 'common-common/src/types';
import {
  ITXModalData,
  ProposalModule,
  ThreadStage,
  ThreadKind,
  Topic,
} from 'models';
import { proposalSlugToClass } from 'identifiers';
import { formatCoin } from 'adapters/currency';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import CosmosAccount from 'controllers/chain/cosmos/account';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import Substrate from 'controllers/chain/substrate/adapter';
import Cosmos from 'controllers/chain/cosmos/adapter';
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
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';

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

type NewProposalFormAttrs = {
  callback?;
  typeEnum;
  onChangeSlugEnum;
};

// this should be titled the Substrate/Edgeware new proposal form
export class NewProposalForm extends ClassComponent<NewProposalFormAttrs> {
  private aaveProposalState;
  private aaveTabCount;
  private activeAaveTabIndex;
  private applicantAddress;
  private cosmosProposalType;
  private councilMotionDescription;
  private councilMotionType;
  private deposit;
  private description;
  private enactmentDelay;
  private error;
  private executor;
  private form: {
    amount;
    beneficiary;
    description;
    reason;
    title;
    topicId;
    topicName;
    value;
  };
  private ipfsHash;
  private member;
  private nextExternalProposalHash;
  private payoutAmount;
  private proposer;
  private recipient;
  private referendumId;
  private sharesRequested;
  private sputnikProposalType;
  private threshold;
  private title;
  private toggleValue;
  private tokenId;
  private tokenTribute;
  private treasuryProposalIndex;
  private votingPeriod;

  oncreate() {
    this.toggleValue = 'proposal';
  }

  oninit() {
    this.aaveTabCount = 1;
    this.activeAaveTabIndex = 0;
    this.aaveProposalState = [
      {
        target: null,
        value: null,
        calldata: null,
        signature: null,
        withDelegateCall: false,
      },
    ];
    this.cosmosProposalType = SupportedCosmosProposalTypes.Text;
    this.sputnikProposalType = SupportedSputnikProposalTypes.AddMemberToRole;
  }

  view(vnode: m.Vnode<NewProposalFormAttrs>) {
    const callback = vnode.attrs.callback;
    const author = app.user.activeAccount;
    const proposalTypeEnum = vnode.attrs.typeEnum;

    if (!author) return <CWText>Must be logged in</CWText>;
    if (!callback) return <CWText>Must have callback</CWText>;
    if (app.chain?.network === ChainNetwork.Plasm)
      return <CWText>Unsupported network</CWText>;

    let hasCouncilMotionChooser: boolean;
    let hasAction: boolean;
    let hasToggle: boolean;
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
      hasDepositChooser = this.toggleValue === 'proposal';
      if (hasDepositChooser) {
        dataLoaded = !!(app.chain as Substrate).democracyProposals?.initialized;
      }
    } else if (proposalTypeEnum === ProposalType.SubstrateCollectiveProposal) {
      hasCouncilMotionChooser = true;
      hasAction =
        this.councilMotionType === 'createExternalProposal' ||
        this.councilMotionType === 'createExternalProposalMajority';
      hasVotingPeriodAndDelaySelector =
        this.councilMotionType === 'createFastTrack' ||
        this.councilMotionType === 'createExternalProposalDefault';
      hasReferendumSelector =
        this.councilMotionType === 'createEmergencyCancellation';
      hasExternalProposalSelector =
        this.councilMotionType === 'vetoNextExternal' ||
        this.councilMotionType === 'createFastTrack' ||
        this.councilMotionType === 'createExternalProposalDefault';
      hasTreasuryProposalSelector =
        this.councilMotionType === 'createTreasuryApprovalMotion' ||
        this.councilMotionType === 'createTreasuryRejectionMotion';
      hasThreshold = this.councilMotionType !== 'vetoNextExternal';
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
      return <div class="NewProposalForm">Invalid proposal type</div>;
    }

    if (
      hasAction &&
      !(app.user.activeAccount as SubstrateAccount).isCouncillor
    ) {
      dataLoaded = false;
    }

    const createNewProposal = () => {
      const done = (result) => {
        this.error = '';
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
            this.form.title,
            this.form.topicName,
            this.form.topicId,
            this.form.description
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
        const deposit = this.deposit
          ? app.chain.chain.coins(this.deposit, true)
          : (app.chain as Substrate).democracyProposals.minimumDeposit;

        if (!EdgewareFunctionPicker.getMethod()) {
          notifyError('Missing arguments');
          return;
        } else if (this.toggleValue === 'proposal') {
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
        } else if (this.toggleValue === 'preimage') {
          vnode.attrs.onChangeSlugEnum('democracypreimage');
          const encodedProposal = EdgewareFunctionPicker.getMethod().toHex();
          args = [author, EdgewareFunctionPicker.getMethod(), encodedProposal];
          createFunc = ([au, mt, pr]) =>
            (app.chain as Substrate).democracyProposals.notePreimage(
              au,
              mt,
              pr
            );
        } else if (this.toggleValue === 'imminent') {
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
        this.councilMotionType === 'vetoNextExternal'
      ) {
        args = [author, this.nextExternalProposalHash];
        createFunc = ([a, h]) =>
          (app.chain as Substrate).council.vetoNextExternal(a, h);
      } else if (
        proposalTypeEnum === ProposalType.SubstrateCollectiveProposal
      ) {
        if (!this.threshold) throw new Error('Invalid threshold');
        const threshold = this.threshold;
        if (this.councilMotionType === 'createExternalProposal') {
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
          this.councilMotionType === 'createExternalProposalMajority'
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
        } else if (this.councilMotionType === 'createExternalProposalDefault') {
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
        } else if (this.councilMotionType === 'createFastTrack') {
          args = [
            author,
            threshold,
            this.nextExternalProposalHash,
            this.votingPeriod,
            this.enactmentDelay,
          ];
          createFunc = ([a, b, c, d, e]) =>
            (app.chain as Substrate).council.createFastTrack(a, b, c, d, e);
        } else if (this.councilMotionType === 'createEmergencyCancellation') {
          args = [author, threshold, this.referendumId];
          createFunc = ([a, t, h]) =>
            (app.chain as Substrate).council.createEmergencyCancellation(
              a,
              t,
              h
            );
        } else if (this.councilMotionType === 'createTreasuryApprovalMotion') {
          args = [author, threshold, this.treasuryProposalIndex];
          createFunc = ([a, t, i]) =>
            (app.chain as Substrate).council.createTreasuryApprovalMotion(
              a,
              t,
              i
            );
        } else if (this.councilMotionType === 'createTreasuryRejectionMotion') {
          args = [author, threshold, this.treasuryProposalIndex];
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
        if (!this.form.beneficiary)
          throw new Error('Invalid beneficiary address');
        const beneficiary = app.chain.accounts.get(this.form.beneficiary);
        args = [author, this.form.amount, beneficiary];
      } else if (proposalTypeEnum === ProposalType.SubstrateBountyProposal) {
        if (!this.form.title) throw new Error('Invalid title');
        if (!this.form.value) throw new Error('Invalid value');
        args = [author, this.form.value, this.form.title];
        createFunc = ([a, v, t]) =>
          (app.chain as Substrate).bounties.createTx(a, v, t);
        return createTXModal(createFunc(args)).then(done);
      } else if (proposalTypeEnum === ProposalType.SubstrateBountyProposal) {
        if (!this.form.reason) throw new Error('Invalid reason');
        if (!this.form.beneficiary)
          throw new Error('Invalid beneficiary address');
        const beneficiary = app.chain.accounts.get(this.form.beneficiary);
        args = [this.form.reason, beneficiary];
      } else if (proposalTypeEnum === ProposalType.PhragmenCandidacy) {
        args = [author];
        createFunc = ([a]) =>
          (
            app.chain as Substrate
          ).phragmenElections.activeElection.submitCandidacyTx(a);
      } else if (proposalTypeEnum === ProposalType.CosmosProposal) {
        let prop: ProtobufAny;
        const { title, description } = this.form;
        const deposit = this.deposit
          ? new CosmosToken(
              (app.chain as Cosmos).governance.minDeposit.denom,
              this.deposit,
              false
            )
          : (app.chain as Cosmos).governance.minDeposit;
        if (this.cosmosProposalType === SupportedCosmosProposalTypes.Text) {
          prop = (app.chain as Cosmos).governance.encodeTextProposal(
            title,
            description
          );
        } else if (
          this.cosmosProposalType ===
          SupportedCosmosProposalTypes.CommunitySpend
        ) {
          prop = (app.chain as Cosmos).governance.encodeCommunitySpend(
            title,
            description,
            this.recipient,
            this.payoutAmount
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
        if (!this.applicantAddress)
          throw new Error('Invalid applicant address');
        if (typeof this.tokenTribute !== 'number')
          throw new Error('Invalid token tribute');
        if (typeof this.sharesRequested !== 'number')
          throw new Error('Invalid shares requested');
        if (!this.title) throw new Error('Invalid title');
        const details = JSON.stringify({
          title: this.title,
          description: this.description || '',
        });
        (app.chain as Moloch).governance
          .createPropWebTx(
            author as MolochMember,
            this.applicantAddress,
            new BN(this.tokenTribute),
            new BN(this.sharesRequested),
            details
          )
          // TODO: handling errors?
          .then((result) => done(result))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.data?.message || err.message));
        return;
      } else if (proposalTypeEnum === ProposalType.CompoundProposal) {
        this.proposer = app.user?.activeAccount?.address;
        if (!this.proposer) throw new Error('Invalid address / not logged in');
        if (!this.description) throw new Error('Invalid description');

        const targets = [];
        const values = [];
        const calldatas = [];
        const signatures = [];

        for (let i = 0; i < this.aaveTabCount; i++) {
          const aaveProposal = this.aaveProposalState[i];
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
        let description = this.description;
        if (this.title) {
          description = JSON.stringify({
            description: this.description,
            title: this.title,
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
        this.proposer = app.user?.activeAccount?.address;
        if (!this.proposer) throw new Error('Invalid address / not logged in');
        if (!this.executor) throw new Error('Invalid executor');
        if (!this.ipfsHash) throw new Error('No ipfs hash');

        const targets = [];
        const values = [];
        const calldatas = [];
        const signatures = [];
        const withDelegateCalls = [];

        for (let i = 0; i < this.aaveTabCount; i++) {
          const aaveProposal = this.aaveProposalState[i];
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
        const ipfsHash = utils.formatBytes32String(this.ipfsHash);
        const details: AaveProposalArgs = {
          executor: this.executor as string,
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
        const member = this.member;
        const description = this.description;
        let propArgs: NearSputnikProposalKind;
        if (
          this.sputnikProposalType ===
          SupportedSputnikProposalTypes.AddMemberToRole
        ) {
          propArgs = {
            AddMemberToRole: { role: 'council', member_id: member },
          };
        } else if (
          this.sputnikProposalType ===
          SupportedSputnikProposalTypes.RemoveMemberFromRole
        ) {
          propArgs = {
            RemoveMemberFromRole: { role: 'council', member_id: member },
          };
        } else if (
          this.sputnikProposalType === SupportedSputnikProposalTypes.Transfer
        ) {
          // TODO: validate amount / token id
          const token_id = this.tokenId || '';
          let amount: string;
          // treat NEAR as in dollars but tokens as whole #s
          if (!token_id) {
            amount = app.chain.chain
              .coins(+this.payoutAmount, true)
              .asBN.toString();
          } else {
            amount = `${+this.payoutAmount}`;
          }
          propArgs = { Transfer: { receiver_id: member, token_id, amount } };
        } else if (
          this.sputnikProposalType === SupportedSputnikProposalTypes.Vote
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
        if (!this.form.beneficiary)
          throw new Error('Invalid beneficiary address');
        const beneficiary = app.chain.accounts.get(this.form.beneficiary);
        args = [author, this.form.description, beneficiary];
      } else {
        throw new Error('Invalid proposal type');
      }
      Promise.resolve(createFunc(args))
        .then((modalData) => createTXModal(modalData))
        .then(done);
    };

    // default state options
    const motions = SubstrateCollectiveProposal.motions;

    if (!this.councilMotionType) {
      this.councilMotionType = motions[0].name;
      this.councilMotionDescription = motions[0].description;
    }

    if (!dataLoaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return (
          <ErrorPage message="Could not connect to chain" title="Proposals" />
        );
      }
      return <CWSpinner />;
    }

    const { activeAaveTabIndex, aaveProposalState } = this;

    return m(Form, { class: 'NewProposalForm' }, [
      m(Grid, [
        m(Col, [
          this.error && m('.error', this.error.message),
          hasCouncilMotionChooser && [
            m(DropdownFormField, {
              title: 'Motion',
              choices: motions.map((m_) => ({
                name: 'councilMotionType',
                value: m_.name,
                label: m_.label,
              })),
              callback: (result) => {
                this.councilMotionType = result;
                this.councilMotionDescription = motions.find(
                  (m_) => m_.name === result
                ).description;
                m.redraw();
              },
            }),
            this.councilMotionDescription &&
              m('.council-motion-description', this.councilMotionDescription),
          ],
          // actions
          hasAction && m(EdgewareFunctionPicker),
          hasTopics &&
            m(TopicSelector, {
              topics: app.topics.getByCommunity(app.chain.id),
              updateFormData: (topic: Topic) => {
                this.form.topicName = topic.name;
                this.form.topicId = topic.id;
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
                  this.form.title = result;
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
                  this.form.title = result;
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
                  if (this.form.description === result) return;
                  this.form.description = result;
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
                oncreate: () => {
                  this.form.beneficiary = author.address;
                },
                oninput: (e) => {
                  const result = (e.target as any).value;
                  this.form.beneficiary = result;
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
                  this.form.amount = app.chain.chain.coins(
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
                    (this.form.amount?.inDollars || 0) *
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
                this.toggleValue = value;
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
                  this.form.value = app.chain.chain.coins(
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
                  this.deposit = parseFloat(result);
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
                  this.votingPeriod = +result;
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
                  this.enactmentDelay = +result;
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
                this.referendumId = result;
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
                this.nextExternalProposalHash = result;
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
                this.treasuryProposalIndex = result;
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
                  this.threshold = +result;
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
                  this.applicantAddress = result;
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
                  this.tokenTribute = +result;
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
                  this.sharesRequested = +result;
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
                  this.title = result;
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
                  this.description = result;
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
                    this.title = result;
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
                    this.description = result;
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
                        this.activeAaveTabIndex = index;
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
                        this.aaveTabCount++;
                        this.activeAaveTabIndex = this.aaveTabCount - 1;
                        this.aaveProposalState.push({
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
                      disabled: this.activeAaveTabIndex === 0,
                      onclick: () => {
                        this.aaveTabCount--;
                        this.activeAaveTabIndex = this.aaveTabCount - 1;
                        this.aaveProposalState.pop();
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
                    this.aaveProposalState[activeAaveTabIndex].target = result;
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
                    this.aaveProposalState[activeAaveTabIndex].value = result;
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
                    this.aaveProposalState[activeAaveTabIndex].calldata =
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
                    this.aaveProposalState[activeAaveTabIndex].signature =
                      result;
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
                    this.ipfsHash = result;
                    m.redraw();
                  },
                }),
              ]),
              m(FormGroup, [
                m(FormLabel, 'Executor'),
                (app.chain as Aave).governance.api.Executors.map((r) =>
                  m(
                    `.executor ${
                      this.executor === r.address && '.selected-executor'
                    }`,
                    {
                      onclick: () => {
                        this.executor = r.address;
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
                        this.activeAaveTabIndex = index;
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
                        this.aaveTabCount++;
                        this.activeAaveTabIndex = this.aaveTabCount - 1;
                        this.aaveProposalState.push({
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
                      disabled: this.activeAaveTabIndex === 0,
                      onclick: () => {
                        this.aaveTabCount--;
                        this.activeAaveTabIndex = this.aaveTabCount - 1;
                        this.aaveProposalState.pop();
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
                    this.aaveProposalState[activeAaveTabIndex].target = result;
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
                    this.aaveProposalState[activeAaveTabIndex].value = result;
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
                    this.aaveProposalState[activeAaveTabIndex].calldata =
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
                    this.aaveProposalState[activeAaveTabIndex].signature =
                      result;
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
                      this.aaveProposalState[
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
                      this.aaveProposalState[
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
              value: this.sputnikProposalType,
              defaultValue: SupportedSputnikProposalTypes.AddMemberToRole,
              choices: Object.values(SupportedSputnikProposalTypes).map(
                (v) => ({
                  name: 'proposalType',
                  label: v,
                  value: v,
                })
              ),
              callback: (result) => {
                this.sputnikProposalType = result;
                m.redraw();
              },
            }),
            m(FormGroup, [
              this.sputnikProposalType !== SupportedSputnikProposalTypes.Vote &&
                m(FormLabel, 'Member'),
              this.sputnikProposalType !== SupportedSputnikProposalTypes.Vote &&
                m(Input, {
                  name: 'member',
                  defaultValue: 'tokenfactory.testnet',
                  oncreate: () => {
                    this.member = 'tokenfactory.testnet';
                  },
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    this.member = result;
                    m.redraw();
                  },
                }),
            ]),
            m(FormGroup, [
              m(FormLabel, 'Description'),
              m(Input, {
                name: 'description',
                defaultValue: '',
                oncreate: () => {
                  this.description = '';
                },
                oninput: (e) => {
                  const result = (e.target as any).value;
                  this.description = result;
                  m.redraw();
                },
              }),
            ]),
            this.sputnikProposalType ===
              SupportedSputnikProposalTypes.Transfer &&
              m(FormGroup, [
                m(FormLabel, 'Token ID (leave blank for Ⓝ)'),
                m(Input, {
                  name: 'token_id',
                  defaultValue: '',
                  oncreate: () => {
                    this.tokenId = '';
                  },
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    this.tokenId = result;
                    m.redraw();
                  },
                }),
              ]),
            this.sputnikProposalType ===
              SupportedSputnikProposalTypes.Transfer &&
              m(FormGroup, [
                m(FormLabel, 'Amount'),
                m(Input, {
                  name: 'amount',
                  defaultValue: '',
                  oncreate: () => {
                    this.payoutAmount = '';
                  },
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    this.payoutAmount = result;
                    m.redraw();
                  },
                }),
              ]),
          ],
          hasCosmosFields && [
            m(DropdownFormField, {
              title: 'Proposal Type',
              value: this.cosmosProposalType,
              defaultValue: SupportedCosmosProposalTypes.Text,
              choices: Object.values(SupportedCosmosProposalTypes).map((v) => ({
                name: 'proposalType',
                label: v,
                value: v,
              })),
              callback: (result) => {
                this.cosmosProposalType = result;
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
                  this.form.title = result;
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
                  if (this.form.description === result) return;
                  this.form.description = result;
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
                  this.deposit = +result;
                  m.redraw();
                },
              }),
            ]),
            this.cosmosProposalType !== SupportedCosmosProposalTypes.Text &&
              m(FormGroup, [
                m(FormLabel, 'Recipient'),
                m(Input, {
                  name: 'recipient',
                  placeholder: app.user.activeAccount.address,
                  defaultValue: '',
                  oncreate: () => {
                    this.recipient = '';
                  },
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    this.recipient = result;
                    m.redraw();
                  },
                }),
              ]),
            this.cosmosProposalType !== SupportedCosmosProposalTypes.Text &&
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
                  oncreate: () => {
                    this.payoutAmount = '';
                  },
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    this.payoutAmount = result;
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
                  this.form.beneficiary = result;
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
                  if (this.form.description === result) return;
                  this.form.description = result;
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
  }
}
