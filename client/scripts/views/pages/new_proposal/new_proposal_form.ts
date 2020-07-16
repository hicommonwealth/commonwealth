import 'pages/new_proposal_page.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { FormGroup, Button, Grid, Col, Spinner } from 'construct-ui';
import BN from 'bn.js';
import { blake2AsHex } from '@polkadot/util-crypto';

import app from 'state';
import { ITXModalData, ProposalModule, ChainBase, OffchainThreadKind } from 'models';
import { ProposalType, proposalSlugToClass, proposalSlugToFriendlyName } from 'identifiers';
import { formatCoin } from 'adapters/currency';
import { CosmosToken } from 'adapters/chain/cosmos/types';

import { notifyError } from 'controllers/app/notifications';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import MolochMember from 'controllers/chain/ethereum/moloch/member';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';

import {
  TextInputFormField,
  TextareaFormField,
  DropdownFormField,
  RadioSelectorFormField
} from 'views/components/forms';
import EdgewareFunctionPicker from 'views/components/edgeware_function_picker';
import { createTXModal } from 'views/modals/tx_signing_modal';
import TagSelector from 'views/components/tag_selector';

// this should be titled the Substrate/Edgeware new proposal form
const NewProposalForm = {
  form: { },
  oncreate: (vnode) => {
    vnode.state.toggleValue = 'proposal';
  },
  view: (vnode) => {
    const callback = vnode.attrs.callback;
    const author = app.user.activeAccount;
    const proposalTypeEnum = vnode.attrs.typeEnum;
    const activeEntity = app.community || app.chain;

    if (!author) return m('div', 'Must be logged in');
    if (!callback) return m('div', 'Must have callback');

    let hasCouncilMotionChooser : boolean;
    let hasAction : boolean;
    let hasToggle : boolean;
    let hasPreimageInput : boolean;
    let hasTitleAndDescription : boolean;
    let hasTags : boolean;
    let hasBeneficiaryAndAmount : boolean;
    let hasPhragmenInfo : boolean;
    let hasDepositChooser : boolean;
    // council motion
    let hasVotingPeriodAndDelaySelector : boolean;
    let hasReferendumSelector : boolean;
    let hasExternalProposalSelector : boolean;
    let hasTreasuryProposalSelector : boolean;
    let hasThreshold : boolean;
    // moloch proposal
    let hasMolochFields : boolean;
    // data loaded
    let dataLoaded : boolean = true;
    if (proposalTypeEnum === ProposalType.SubstrateDemocracyProposal) {
      hasAction = true;
      hasToggle = true;
      hasDepositChooser = (vnode.state.toggleValue === 'proposal');
      if (hasDepositChooser) {
        dataLoaded = !!(app.chain as Substrate).democracyProposals?.minimumDeposit;
      }
    } else if (proposalTypeEnum === ProposalType.SubstrateCollectiveProposal) {
      hasCouncilMotionChooser = true;
      hasAction = vnode.state.councilMotionType === 'createExternalProposal'
        || vnode.state.councilMotionType === 'createExternalProposalMajority';
      hasVotingPeriodAndDelaySelector = vnode.state.councilMotionType === 'createFastTrack'
        || vnode.state.councilMotionType === 'createExternalProposalDefault';
      hasReferendumSelector = vnode.state.councilMotionType === 'createEmergencyCancellation';
      hasExternalProposalSelector = vnode.state.councilMotionType === 'vetoNextExternal'
        || vnode.state.councilMotionType === 'createFastTrack'
        || vnode.state.councilMotionType === 'createExternalProposalDefault';
      hasTreasuryProposalSelector = vnode.state.councilMotionType === 'createTreasuryApprovalMotion'
        || vnode.state.councilMotionType === 'createTreasuryRejectionMotion';
      hasThreshold = vnode.state.councilMotionType !== 'vetoNextExternal';
      if (hasExternalProposalSelector) dataLoaded = !!(app.chain as Substrate).democracyProposals;
    } else if (proposalTypeEnum === ProposalType.EdgewareSignalingProposal) {
      hasTitleAndDescription = true;
    } else if (proposalTypeEnum === ProposalType.OffchainThread) {
      hasTitleAndDescription = true;
      hasTags = true;
    } else if (proposalTypeEnum === ProposalType.SubstrateTreasuryProposal) {
      hasBeneficiaryAndAmount = true;
      const treasury = (app.chain as Substrate).treasury;
      dataLoaded = !!treasury.bondMinimum && !!treasury.bondPct;
    } else if (proposalTypeEnum === ProposalType.PhragmenCandidacy) {
      hasPhragmenInfo = true;
      const elections = (app.chain as Substrate).phragmenElections;
      dataLoaded = !!elections.candidacyBond && !!elections.desiredRunnersUp;
    } else if (proposalTypeEnum === ProposalType.CosmosProposal) {
      hasTitleAndDescription = true;
      hasDepositChooser = true;
      dataLoaded = !!(app.chain as Cosmos).governance;
    } else if (proposalTypeEnum === ProposalType.MolochProposal) {
      hasMolochFields = true;
    } else {
      return m('.NewProposalForm', 'Invalid proposal type');
    }

    if (hasAction && !(app.user.activeAccount as SubstrateAccount).isCouncillor) {
      dataLoaded = false;
    }

    const createNewProposal = () => {
      const done = (result) => {
        vnode.state.error = '';
        callback(result);
      };
      let createFunc: (...args) => ITXModalData | Promise<ITXModalData> = (a) => {
        return (proposalSlugToClass().get(proposalTypeEnum) as ProposalModule<any, any, any>).createTx(...a);
      };
      let args = [];
      if (proposalTypeEnum === ProposalType.OffchainThread) {
        app.threads.create(
          author.address,
          OffchainThreadKind.Forum,
          vnode.state.form.tagName,
          vnode.state.form.tagId,
          vnode.state.form.title,
          vnode.state.form.description,
          vnode.state.form.categoryId,
        ).then(done)
          .then(() => { m.redraw(); })
          .catch((err) => { console.error(err); });
        return;
      } else if (proposalTypeEnum === ProposalType.SubstrateDemocracyProposal) {
        const deposit = vnode.state.deposit
          ? app.chain.chain.coins(vnode.state.deposit, true)
          : (app.chain as Substrate).democracyProposals.minimumDeposit;

        if (vnode.state.toggleValue === 'proposal') {
          const proposalHash = blake2AsHex(EdgewareFunctionPicker.getMethod().method.toHex());
          args = [author, EdgewareFunctionPicker.getMethod(), proposalHash, deposit];
          createFunc = ([au, mt, pr, dep]) => (app.chain as Substrate).democracyProposals.createTx(au, mt, pr, dep);
        } else if (vnode.state.toggleValue === 'preimage') {
          vnode.attrs.onChangeSlugEnum('democracypreimage');
          const encodedProposal = EdgewareFunctionPicker.getMethod().method.toHex();
          args = [author, EdgewareFunctionPicker.getMethod(), encodedProposal];
          createFunc = ([au, mt, pr]) => (app.chain as Substrate).democracyProposals.notePreimage(au, mt, pr);
        } else if (vnode.state.toggleValue === 'imminent') {
          vnode.attrs.onChangeSlugEnum('democracyimminent');
          const encodedProposal = EdgewareFunctionPicker.getMethod().method.toHex();
          args = [author, EdgewareFunctionPicker.getMethod(), encodedProposal];
          createFunc = ([au, mt, pr]) => (app.chain as Substrate).democracyProposals.noteImminentPreimage(au, mt, pr);
        } else {
          throw new Error('Invalid toggle state');
        }

        mixpanel.track('Create Thread', {
          'Step No': 2,
          'Step' : 'Submit Proposal',
          'Proposal Type': 'Democracy',
          'Thread Type': 'Proposal',
        });
      } else if (proposalTypeEnum === ProposalType.SubstrateCollectiveProposal
                 && vnode.state.councilMotionType === 'vetoNextExternal') {
        args = [author, vnode.state.nextExternalProposalHash];
        createFunc = ([a, h]) => (app.chain as Substrate).council.vetoNextExternal(a, h);
        mixpanel.track('Create Thread', {
          'Step No': 2,
          'Step' : 'Submit Proposal',
          'Proposal Type': 'Council Motion',
          'Thread Type': 'Proposal',
        });
      } else if (proposalTypeEnum === ProposalType.SubstrateCollectiveProposal) {
        if (!vnode.state.threshold) throw new Error('Invalid threshold');
        const threshold = vnode.state.threshold;
        if (vnode.state.councilMotionType === 'createExternalProposal') {
          args = [author, threshold, EdgewareFunctionPicker.getMethod()];
          createFunc = ([a, t, m]) => (app.chain as Substrate).council.createExternalProposal(a, t, m);
        } else if (vnode.state.councilMotionType === 'createExternalProposalMajority') {
          args = [author, threshold, EdgewareFunctionPicker.getMethod()];
          createFunc = ([a, t, m]) => (app.chain as Substrate).council.createExternalProposalMajority(a, t, m);
        } else if (vnode.state.councilMotionType === 'createExternalProposalDefault') {
          args = [author, threshold, EdgewareFunctionPicker.getMethod()];
          createFunc = ([a, t, m]) => (app.chain as Substrate).council.createExternalProposalDefault(a, t, m);
        } else if (vnode.state.councilMotionType === 'createFastTrack') {
          args = [author, threshold, vnode.state.nextExternalProposalHash,
            vnode.state.votingPeriod, vnode.state.enactmentDelay];
          createFunc = ([a, b, c, d, e]) => (app.chain as Substrate).council.createFastTrack(a, b, c, d, e);
        } else if (vnode.state.councilMotionType === 'createEmergencyCancellation') {
          args = [author, threshold, vnode.state.referendumId];
          createFunc = ([a, t, h]) => (app.chain as Substrate).council.createEmergencyCancellation(a, t, h);
        } else if (vnode.state.councilMotionType === 'createTreasuryApprovalMotion') {
          args = [author, threshold, vnode.state.treasuryProposalIndex];
          createFunc = ([a, t, i]) => (app.chain as Substrate).council.createTreasuryApprovalMotion(a, t, i);
        } else if (vnode.state.councilMotionType === 'createTreasuryRejectionMotion') {
          args = [author, threshold, vnode.state.treasuryProposalIndex];
          createFunc = ([a, t, i]) => (app.chain as Substrate).council.createTreasuryRejectionMotion(a, t, i);
        } else {
          throw new Error('Invalid council motion type');
        }
        mixpanel.track('Create Thread', {
          'Step No': 2,
          'Step' : 'Submit Proposal',
          'Proposal Type': 'Council Motion',
          'Thread Type': 'Proposal',
        });
        return createTXModal(createFunc(args)).then(done);
      } else if (proposalTypeEnum === ProposalType.EdgewareSignalingProposal) {
        args = [author, vnode.state.form.title, vnode.state.form.description];
        mixpanel.track('Create Thread', {
          'Step No': 2,
          'Step' : 'Submit Proposal',
          'Proposal Type': 'Signaling',
          'Thread Type': 'Proposal',
        });
      } else if (proposalTypeEnum === ProposalType.SubstrateTreasuryProposal) {
        if (!vnode.state.form.beneficiary) throw new Error('Invalid beneficiary address');
        const beneficiary = app.chain.accounts.get(vnode.state.form.beneficiary);
        args = [author, vnode.state.form.amount, beneficiary];
        mixpanel.track('Create Thread', {
          'Step No': 2,
          'Step' : 'Submit Proposal',
          'Proposal Type': 'Treasury',
          'Thread Type': 'Proposal',
        });
      } else if (proposalTypeEnum === ProposalType.PhragmenCandidacy) {
        args = [author];
        createFunc = ([a]) => (app.chain as Substrate).phragmenElections.activeElection.submitCandidacyTx(a);
        mixpanel.track('Create Thread', {
          'Step No': 2,
          'Step' : 'Submit Proposal',
          'Proposal Type': 'Phragmen Council Candidacy',
          'Thread Type': 'Proposal',
        });
      } else if (proposalTypeEnum === ProposalType.CosmosProposal) {
        const deposit = vnode.state.deposit
          ? new CosmosToken((app.chain as Cosmos).governance.minDeposit.denom, vnode.state.deposit, false)
          : (app.chain as Cosmos).governance.minDeposit;
        args = [author, vnode.state.form.title, vnode.state.form.description, deposit];
        mixpanel.track('Create Thread', {
          'Step No': 2,
          'Step' : 'Submit Proposal',
          'Proposal Type': 'Cosmos',
          'Thread Type': 'Proposal',
        });
      } else if (proposalTypeEnum === ProposalType.MolochProposal) {
        // TODO: check that applicant is valid ETH address in hex
        if (!vnode.state.applicantAddress) throw new Error('Invalid applicant address');
        if (typeof vnode.state.tokenTribute !== 'number') throw new Error('Invalid token tribute');
        if (typeof vnode.state.sharesRequested !== 'number') throw new Error('Invalid shares requested');
        if (!vnode.state.title) throw new Error('Invalid title');
        const details = JSON.stringify({ title: vnode.state.title, description: vnode.state.description || '' });
        (app.chain as Moloch).governance.createPropWebTx(
          author as MolochMember,
          vnode.state.applicantAddress,
          new BN(vnode.state.tokenTribute),
          new BN(vnode.state.sharesRequested),
          details,
        )
        // TODO: handling errors?
          .then((result) => done(result))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
        return;
      } else {
        mixpanel.track('Create Thread', {
          'Step No': 2,
          'Step' : 'Incorrect Proposal',
          'Thread Type': 'Proposal',
        });
        throw new Error('Invalid proposal type');
      }
      Promise.resolve(createFunc(args))
        .then((modalData) => createTXModal(modalData))
        .then(done);
    };

    // construct-ui grid options
    const span = {
      xs: 12,
      sm: 12,
      md: 11,
      lg: 10,
      xl: 8,
    };

    // default state options
    const motions = SubstrateCollectiveProposal.motions;
    if (!vnode.state.councilMotionType) {
      vnode.state.councilMotionType = motions[0].name;
      vnode.state.councilMotionDescription = motions[0].description;
    }

    // shorthands
    const isSubstrate = app.chain.base === ChainBase.Substrate;
    const asSubstrate = (app.chain as Substrate);
    const isCosmos = app.chain.base === ChainBase.CosmosSDK;
    const asCosmos = (app.chain as Cosmos);

    if (!dataLoaded) {
      return m(Spinner, {
        fill: true,
        message: 'Proposal loading...',
        size: 'xl',
        style: 'visibility: visible; opacity: 1;'
      });
    }

    const activeEntityInfo = app.community ? app.community.meta : app.chain.meta.chain;

    return m('.NewProposalForm', [
      m(Grid, [
        m(Col, { span }, [
          vnode.state.error && m('.error', vnode.state.error.message),
          hasCouncilMotionChooser && [
            m(DropdownFormField, {
              title: 'Motion',
              choices: motions.map(
                (m_) => ({ name: 'councilMotionType', value: m_.name, label: m_.label })
              ),
              callback: (result) => {
                if (vnode.state.councilMotionType === result) return;
                vnode.state.councilMotionType = result;
                vnode.state.councilMotionDescription = motions.find((m_) => m_.name === result).description;
                m.redraw();
              },
            }),
            vnode.state.councilMotionDescription
              && m('.council-motion-description', vnode.state.councilMotionDescription),
          ],
          // actions
          hasAction && m(EdgewareFunctionPicker),
          hasTags
            && m(TagSelector, {
              tags: app.tags.getByCommunity(app.activeId()),
              featuredTags: app.tags.getByCommunity(app.activeId()).filter((ele) => activeEntityInfo.featuredTags.includes(`${ele.id}`)),
              updateFormData: (tagName: string, tagId?: number) => {
                vnode.state.form.tagName = tagName;
                vnode.state.form.tagId = tagId;
              },
              tabindex: 3,
            }),
          hasTitleAndDescription && [
            m(TextInputFormField, {
              options: {
                name: 'title',
                placeholder: 'Enter a title',
                autofocus: true,
              },
              callback: (result) => {
                if (vnode.state.form.title === result) return;
                vnode.state.form.title = result;
                m.redraw();
              },
            }),
            m(TextareaFormField, {
              options: {
                name: 'description',
                placeholder: 'Enter a description',
              },
              callback: (result) => {
                if (vnode.state.form.description === result) return;
                vnode.state.form.description = result;
                m.redraw();
              },
            }),
          ],
          hasBeneficiaryAndAmount && [
            m(TextInputFormField, {
              title: 'Beneficiary',
              options: {
                name: 'beneficiary',
                placeholder: 'Beneficiary of treasury proposal',
                oncreate: (vnode2) => {
                  $(vnode2.dom).val(author.address);
                  vnode.state.form.beneficiary = author.address;
                }
              },
              callback: (result) => {
                if (vnode.state.form.beneficiary === result) return;
                vnode.state.form.beneficiary = result;
                m.redraw();
              },
            }),
            m(TextInputFormField, {
              title: 'Amount (EDG)',
              options: {
                name: 'amount',
                autofocus: true,
                placeholder: 'Amount of treasury proposal',
              },
              callback: (result) => {
                if (vnode.state.form.amount === app.chain.chain.coins(parseFloat(result), true)) return;
                vnode.state.form.amount = app.chain.chain.coins(parseFloat(result), true);
                m.redraw();
              },
            }),
            m('p', [
              'Bond: ',
              app.chain.chain.coins(
                Math.max(
                  (vnode.state.form.amount?.inDollars || 0) * (app.chain as Substrate).treasury.bondPct,
                  (app.chain as Substrate).treasury.bondMinimum.inDollars
                ), true
              ).format(),
              ` (${(app.chain as Substrate).treasury.bondPct * 100}% of requested amount, `,
              `minimum ${(app.chain as Substrate).treasury.bondMinimum.format()})`,
            ]),
          ],
          hasPhragmenInfo
            && m('.council-slot-info', [
              m('p', [
                'Becoming a candidate requires a deposit of ',
                formatCoin((app.chain as Substrate).phragmenElections.candidacyBond),
                '. It will be returned if you are elected, or carried over to the next election if you are in the top ',
                `${(app.chain as Substrate).phragmenElections.desiredRunnersUp} runners-up.`
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
                { label: 'Upload Imminent Preimage', value: 'imminent', checked: false },
              ],
              name: 'democracy-tx-switcher',
            }),
          ],
          hasDepositChooser && [
            m(TextInputFormField, {
              title: `Deposit (${app.chain.base === ChainBase.Substrate
                ? app.chain.currency
                : (app.chain as Cosmos).governance.minDeposit.denom})`,
              options: {
                name: 'deposit',
                placeholder: `Min: ${app.chain.base === ChainBase.Substrate
                  ? (app.chain as Substrate).democracyProposals.minimumDeposit.inDollars
                  : +(app.chain as Cosmos).governance.minDeposit}`,
                oncreate: (vnode_) => $(vnode_.dom).val(app.chain.base === ChainBase.Substrate
                  ? (app.chain as Substrate).democracyProposals.minimumDeposit.inDollars
                  : +(app.chain as Cosmos).governance.minDeposit),
              },
              callback: (result) => {
                vnode.state.deposit = parseFloat(result);
                m.redraw();
              },
            }),
          ],
          hasVotingPeriodAndDelaySelector && [
            m(TextInputFormField, {
              title: 'Voting Period',
              options: {
                name: 'voting_period',
                placeholder: 'Blocks (minimum enforced)',
              },
              callback: (result) => {
                if (vnode.state.votingPeriod === +result) return;
                vnode.state.votingPeriod = +result;
                m.redraw();
              },
            }),
            m(TextInputFormField, {
              title: 'Enactment Delay',
              options: {
                name: 'enactment_delay',
                placeholder: 'Blocks (minimum enforced)',
              },
              callback: (result) => {
                if (vnode.state.enactmentDelay === +result) return;
                vnode.state.enactmentDelay = +result;
                m.redraw();
              },
            }),
          ],
          hasReferendumSelector
            && m(DropdownFormField, {
              title: 'Referendum',
              choices: (app.chain as Substrate).democracy.store.getAll().map(
                (r) => ({ name: 'referendum', value: r.identifier, label: `${r.shortIdentifier}: ${r.title}` })
              ),
              callback: (result) => {
                if (vnode.state.referendumId === result) return;
                vnode.state.referendumId = result;
                m.redraw();
              },
            }),
          hasExternalProposalSelector
            && m(DropdownFormField, {
              title: 'Proposal',
              choices: (app.chain as Substrate).democracyProposals.nextExternal ? [{
                name: 'external_proposal',
                value: (app.chain as Substrate).democracyProposals.nextExternal[0].hash.toString(),
                label: `${(app.chain as Substrate).democracyProposals.nextExternal[0].hash.toString().slice(0, 8)}...`,
              }] : [],
              callback: (result) => {
                if (vnode.state.nextExternalProposalHash === result) return;
                vnode.state.nextExternalProposalHash = result;
                m.redraw();
              },
            }),
          hasTreasuryProposalSelector && m(DropdownFormField, {
            title: 'Treasury Proposal',
            choices: (app.chain as Substrate).treasury.store.getAll().map(
              (r) => ({ name: 'external_proposal', value: r.identifier, label: r.shortIdentifier })
            ),
            callback: (result) => {
              if (vnode.state.treasuryProposalIndex === result) return;
              vnode.state.treasuryProposalIndex = result;
              m.redraw();
            },
          }),
          hasThreshold && [
            m(TextInputFormField, {
              title: 'Threshold',
              options: {
                name: 'threshold',
                placeholder: 'How many members must vote yes to execute?',
              },
              callback: (result) => {
                if (vnode.state.threshold === +result) return;
                vnode.state.threshold = +result;
                m.redraw();
              },
            }),
          ],
          hasMolochFields && [
            m(TextInputFormField, {
              title: 'Applicant Address',
              subtitle: 'The person who will get Moloch shares.',
              options: {
                name: 'applicant_address',
                placeholder: 'Applicant Address',
              },
              callback: (result) => {
                if (vnode.state.applicantAddress === result) return;
                vnode.state.applicantAddress = result;
                m.redraw();
              },
            }),
            m(TextInputFormField, {
              title: 'Token Tribute',
              subtitle: 'The amount the applicant is offering Moloch, must pre-approve tokens.',
              options: {
                name: 'token_tribute',
                placeholder: 'Tribute in tokens',
              },
              callback: (result) => {
                if (vnode.state.tokenTribute === +result) return;
                vnode.state.tokenTribute = +result;
                m.redraw();
              },
            }),
            m(TextInputFormField, {
              title: 'Shares Requested',
              subtitle: 'The number of shares that the applicant will get in return for the tribute',
              options: {
                name: 'shares_requested',
                placeholder: 'Moloch shares requested',
              },
              callback: (result) => {
                if (vnode.state.sharesRequested === +result) return;
                vnode.state.sharesRequested = +result;
                m.redraw();
              },
            }),
            m(TextInputFormField, {
              title: 'Title',
              options: {
                name: 'title',
                placeholder: 'Proposal Title',
              },
              callback: (result) => {
                if (vnode.state.title === result) return;
                vnode.state.title = result;
                m.redraw();
              },
            }),
            m(TextInputFormField, {
              title: 'Description',
              options: {
                name: 'description',
                placeholder: 'Proposal Description',
              },
              callback: (result) => {
                if (vnode.state.description === result) return;
                vnode.state.description = result;
                m.redraw();
              },
            }),
          ],
          m(FormGroup, [
            m(Button, {
              class: (proposalTypeEnum === ProposalType.SubstrateCollectiveProposal
                && !(author as SubstrateAccount).isCouncillor) ? 'disabled' : '',
              intent: 'primary',
              label: proposalTypeEnum === ProposalType.OffchainThread
                ? 'Create thread'
                : 'Go to send transaction',
              onclick: (e) => {
                e.preventDefault();
                createNewProposal();
              },
              tabindex: 4,
              type: 'submit',
            }),
          ]),
        ])
      ]),
    ]);
  }
};

export default NewProposalForm;
