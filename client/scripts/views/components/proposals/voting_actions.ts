import 'components/proposals/voting_actions.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { hexToUtf8 } from 'web3-utils';
import { Button, Input } from 'construct-ui';

import app from 'state';
import { CosmosAccount } from 'controllers/chain/cosmos/account';
import { CosmosVote, CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { ProposalStatus, BinaryVote, DepositVote, VotingType, AnyProposal } from 'models';
import { SubstrateDemocracyReferendum, convictionToWeight } from 'controllers/chain/substrate/democracy_referendum';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { CountdownUntilBlock } from 'views/components/countdown';
import ConvictionsChooser from 'views/components/proposals/convictions_chooser';
import BalanceInfo from 'views/components/proposals/balance_info';
import { createTXModal } from 'views/modals/tx_signing_modal';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateChain from 'controllers/chain/substrate/shared';
import { SubstratePhragmenElection } from 'controllers/chain/substrate/phragmen_election';
import MolochProposal, {
  MolochProposalVote,
  MolochVote,
  MolochProposalState
} from 'controllers/chain/ethereum/moloch/proposal';
import MarlinProposal, {
  MarlinProposalVote,
  MarlinProposalState,
  MarlinVote
} from 'controllers/chain/ethereum/marlin/proposal';
import EthereumAccount from 'controllers/chain/ethereum/account';
import { notifyError } from 'controllers/app/notifications';

const CannotVote: m.Component<{ action }> = {
  view: (vnode) => {
    return m('.CannotVote', [
      m('.proposal-voting-box-action', [
        m(Button, {
          intent: 'primary',
          disabled: true,
          fluid: true,
          label: vnode.attrs.action,
          rounded: true,
          compact: true,
        }),
      ]),
    ]);
  }
};

const ProposalExtensions: m.Component<{ proposal, callback?, setDemocracyVoteConviction?, setDemocracyVoteAmount? }> = {
  view: (vnode) => {
    const proposal = vnode.attrs.proposal;
    const callback = vnode.attrs.callback;
    const user: SubstrateAccount = app.user.activeAccount as SubstrateAccount;
    if (vnode.attrs.proposal instanceof SubstrateDemocracyReferendum) {
      if (!vnode.attrs.setDemocracyVoteConviction) return 'Misconfigured';
      if (!vnode.attrs.setDemocracyVoteAmount) return 'Misconfigured';
      if (!app.user.activeAccount) return 'Misconfigured';
      return m('.ProposalExtensions', [
        m('div', { style: 'font-size: 90%; line-height: 1.2;' }, [
          'The winning side\'s coins will be timelocked according to the weight of their vote:'
        ]),
        m('div', { style: 'margin: 16px 0 12px;' }, [
          m(ConvictionsChooser, { callback: vnode.attrs.setDemocracyVoteConviction }),
        ]),
        m(Input, {
          fluid: true,
          class: 'democracy-referendum-vote-amount',
          placeholder: `Amount to vote (${app.chain?.chain?.denom})`,
          oncreate: (vvnode) => {
            vnode.attrs.setDemocracyVoteAmount(0);
          },
          oninput: (e) => {
            vnode.attrs.setDemocracyVoteAmount(parseFloat(e.target.value));
          },
        }),
        app.user.activeAccount instanceof SubstrateAccount
          && m(BalanceInfo, { account: app.user.activeAccount }),
      ]);
    } else if (vnode.attrs.proposal instanceof SubstrateDemocracyProposal) {
      return m('.ProposalExtensions', [
        m('.proposal-second', 'Cost to second: ', proposal.deposit.format())
      ]);
    } else if (vnode.attrs.proposal instanceof SubstratePhragmenElection) {
      const votingBond = (app.chain as Substrate).phragmenElections.votingBond;
      return m('.ProposalExtensions', [
        'Voting on councillor candidacies requires a voting bond of ',
        m('strong', votingBond ? votingBond.format() : '--'),
        ', which is returned when the election is completed.',
        // TODO XXX: check whether user has deposited a voting bond
        // m('.proposal-bond', 'You have not deposited a voting bond for the current election.'),
        // m('.proposal-bond', 'You have already deposited a voting bond for the current election.'),
      ]);
    }
  }
};

const VotingActions: m.Component<{ proposal: AnyProposal }, {
  conviction: number,
  amount: number,
  votingModalOpen: boolean
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const { votingModalOpen } = vnode.state;
    if (proposal instanceof SubstrateTreasuryProposal) {
      return;
      // TODO: Set up actions to create a council or democracy proposal
      // return m(CannotVote, { action: 'Send to council or democracy' });
    } else if (!app.isLoggedIn()) {
      return m(CannotVote, { action: 'Log in to vote' });
    } else if (!app.user.activeAccount) {
      return m(CannotVote, { action: 'Connect an address to vote' });
    } else if (!proposal.canVoteFrom(app.user.activeAccount)) {
      return m(CannotVote, { action: 'Cannot vote from this address' });
    }

    let user;
    if (proposal instanceof SubstrateDemocracyProposal
        || proposal instanceof SubstrateDemocracyReferendum
        || proposal instanceof SubstratePhragmenElection
        || proposal instanceof SubstrateCollectiveProposal) {
      user = app.user.activeAccount as SubstrateAccount;
    } else if (proposal instanceof CosmosProposal) {
      user = app.user.activeAccount as CosmosAccount;
    } else if (proposal instanceof MolochProposal) {
      user = app.user.activeAccount as EthereumAccount;
    } else if (proposal instanceof MarlinProposal) {
      user = app.user.activeAccount as EthereumAccount;
    } else {
      return m(CannotVote, { action: 'Unrecognized proposal type' });
    }

    const onModalClose = () => {
      vnode.state.votingModalOpen = false;
      m.redraw();
    };

    const voteYes = async (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = true;
      mixpanel.track('Proposal Funnel', {
        'Step No': 3,
        'Step': 'Vote Yes',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        'Scope': app.activeId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Vote Created': new Date().toISOString()
      });
      if (proposal instanceof SubstrateDemocracyProposal) {
        createTXModal(proposal.submitVoteTx(new DepositVote(user, proposal.deposit), onModalClose));
        // TODO: new code, test
      } else if (proposal instanceof SubstrateDemocracyReferendum) {
        if (vnode.state.conviction === undefined) {
          vnode.state.votingModalOpen = false;
          return notifyError('Must select a conviction');
        }
        if (vnode.state.amount === 0) {
          vnode.state.votingModalOpen = false;
          return notifyError('Must select a valid amount');
        }
        createTXModal(proposal.submitVoteTx(
          new BinaryVote(user, true, vnode.state.amount, convictionToWeight(vnode.state.conviction)), onModalClose
        ));
      } else if (proposal instanceof SubstrateCollectiveProposal) {
        createTXModal(proposal.submitVoteTx(new BinaryVote(user, true), onModalClose));
      } else if (proposal instanceof CosmosProposal) {
        proposal.voteTx(new CosmosVote(user, 'Yes'))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof MolochProposal) {
        proposal.submitVoteWebTx(new MolochProposalVote(user, MolochVote.YES))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof MarlinProposal) {
        proposal.submitVoteWebTx(new MarlinProposalVote(user, MarlinVote.YES))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof SubstratePhragmenElection) {
        vnode.state.votingModalOpen = false;
        return notifyError('Unimplemented proposal type - use election voting modal');
      } else {
        vnode.state.votingModalOpen = false;
        return notifyError('Invalid proposal type');
      }
    };
    const voteNo = (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = true;
      mixpanel.track('Proposal Funnel', {
        'Step No': 3,
        'Step': 'Vote No',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        'Scope': app.activeId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Vote Created': new Date().toISOString()
      });
      if (proposal instanceof SubstrateDemocracyReferendum) {
        if (vnode.state.conviction === undefined) {
          vnode.state.votingModalOpen = false;
          return notifyError('Must select a conviction'); // TODO: new code, test
        }
        if (vnode.state.amount === 0) {
          vnode.state.votingModalOpen = false;
          return notifyError('Must select a valid amount');
        }
        createTXModal(proposal.submitVoteTx(new BinaryVote(user, false, vnode.state.amount,
          convictionToWeight(vnode.state.conviction)), onModalClose));
      } else if (proposal instanceof SubstrateCollectiveProposal) {
        createTXModal(proposal.submitVoteTx(new BinaryVote(user, false), onModalClose));
      } else if (proposal instanceof CosmosProposal) {
        createTXModal(proposal.submitVoteTx(new CosmosVote(user, 'No'), null, onModalClose));
      } else if (proposal instanceof MolochProposal) {
        proposal.submitVoteWebTx(new MolochProposalVote(user, MolochVote.NO)).then(() => m.redraw());
      } else if (proposal instanceof MarlinProposal) {
        proposal.submitVoteWebTx(new MarlinProposalVote(user, MarlinVote.NO))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else {
        vnode.state.votingModalOpen = false;
        return notifyError('Invalid proposal type');
      }
    };
    const cancelProposal = (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = true;
      mixpanel.track('Proposal Funnel', {
        'Step No': 3,
        'Step': 'Cancel Proposal',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        'Scope': app.activeId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Thread Created': new Date().toISOString()
      });
      if (proposal instanceof MolochProposal) {
        proposal.abortTx()
          .then(() => { onModalClose(); m.redraw(); })
          .catch((err) => { onModalClose(); notifyError(err.toString()); });
      } else if (proposal instanceof MarlinProposal) {
        proposal.cancelTx()
          .then(() => { onModalClose(); m.redraw(); })
          .catch((err) => { onModalClose(); notifyError(err.toString()); });
      } else {
        vnode.state.votingModalOpen = false;
        return notifyError('Invalid proposal type');
      }
    };
    // V2 only
    // const sponsorProposal = (e) => {
    //   e.preventDefault();
    //   vnode.state.votingModalOpen = true;
    //   mixpanel.track('Proposal Funnel', {
    //     'Step No': 3,
    //     'Step': 'Cancel Proposal',
    //     'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
    //     'Scope': app.activeId() ,
    //   });
    //   mixpanel.people.increment('Votes');
    //   mixpanel.people.set({
    //     'Last Thread Created': new Date().toISOString()
    //   });
    //   if (proposal instanceof MolochProposal) {
    //     proposal.sponsorTx(proposal, user);
    //   } else {
    //     vnode.state.votingModalOpen = false;
    //     return notifyError('Invalid proposal type');
    //   }
    // };
    const processProposal = (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = true;
      mixpanel.track('Proposal Funnel', {
        'Step No': 3,
        'Step': 'Cancel Proposal',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        'Scope': app.activeId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Thread Created': new Date().toISOString()
      });
      if (proposal instanceof MolochProposal) {
        proposal.processTx()
          .then(() => { onModalClose(); m.redraw(); })
          .catch((err) => { onModalClose(); notifyError(err.toString()); });
      } else {
        vnode.state.votingModalOpen = false;
        return notifyError('Invalid proposal type');
      }
    };
    const voteAbstain = (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = true;
      mixpanel.track('Proposal Funnel', {
        'Step No': 3,
        'Step': 'Vote Abstain',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        'Scope': app.activeId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Thread Created': new Date().toISOString()
      });
      if (proposal instanceof CosmosProposal) {
        createTXModal(proposal.submitVoteTx(new CosmosVote(user, 'Abstain'), null, onModalClose));
      } else {
        vnode.state.votingModalOpen = false;
        return notifyError('Invalid proposal type');
      }
    };
    const voteVeto = (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = true;
      mixpanel.track('Proposal Funnel', {
        'Step No': 3,
        'Step': 'Vote Veto',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        'Scope': app.activeId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Thread Created': new Date().toISOString()
      });
      if (proposal instanceof CosmosProposal) {
        createTXModal(proposal.submitVoteTx(new CosmosVote(user, 'NoWithVeto'), null, onModalClose));
      } else {
        vnode.state.votingModalOpen = false;
        return notifyError('Invalid proposal type');
      }
    };

    const voteForChoice = (e, choice) => {
      e.preventDefault();
      vnode.state.votingModalOpen = true;
      mixpanel.track('Proposal Funnel', {
        'Step No': 3,
        'Step': `Vote for choice ${choice.toString()}`,
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        'Scope': app.activeId(),
      });
    };

    let hasVotedYes;
    let hasVotedNo;
    let hasVotedAbstain;
    let hasVotedVeto;
    let hasVotedForAnyChoice;
    const hasVotedForChoice = {};
    if (proposal instanceof SubstrateDemocracyProposal) {
      hasVotedYes = proposal.getVotes().filter((vote) => {
        return vote.account.address === user.address;
      }).length > 0;
      hasVotedForAnyChoice = hasVotedYes;
    } else if (proposal instanceof CosmosProposal) {
      hasVotedYes = user && proposal.getVotes()
        .filter((vote) => vote.choice === 'Yes' && vote.account.address === user.address).length > 0;
      hasVotedNo = user && proposal.getVotes()
        .filter((vote) => vote.choice === 'No' && vote.account.address === user.address).length > 0;
      hasVotedAbstain = user && proposal.getVotes()
        .filter((vote) => vote.choice === 'Abstain' && vote.account.address === user.address).length > 0;
      hasVotedVeto = user && proposal.getVotes()
        .filter((vote) => vote.choice === 'NoWithVeto' && vote.account.address === user.address).length > 0;
    } else if (proposal instanceof MolochProposal) {
      hasVotedYes = user && proposal.getVotes()
        .filter((vote) => vote.choice === MolochVote.YES && vote.account.address === user.address).length > 0;
      hasVotedNo = user && proposal.getVotes()
        .filter((vote) => vote.choice === MolochVote.NO && vote.account.address === user.address).length > 0;
    } else if (proposal instanceof MarlinProposal) {
      hasVotedYes = user && proposal.getVotes()
        .filter((vote) => vote.choice === MarlinVote.YES && vote.account.address === user.address).length > 0;
      hasVotedNo = user && proposal.getVotes()
        .filter((vote) => vote.choice === MarlinVote.NO && vote.account.address === user.address).length > 0;
    }

    let canVote = true;
    if (proposal.completed) {
      canVote = false;
    } else if (proposal.isPassing === ProposalStatus.Passed || proposal.isPassing === ProposalStatus.Failed) {
      canVote = false;
    } else if (proposal instanceof MolochProposal && proposal.state !== MolochProposalState.Voting) {
      canVote = false;
    } else if (proposal instanceof MarlinProposal  /* && (await proposal.state()) !== MarlinProposalState.Active */) {
      canVote = false; // TODO: Fix proposal.state function above to not return promise
    } else if (hasVotedForAnyChoice) {
      // enable re-voting for particular types
      if (proposal instanceof SubstratePhragmenElection
          || proposal instanceof SubstrateDemocracyProposal
          || proposal instanceof SubstrateCollectiveProposal) {
        canVote = true;
      } else {
        canVote = false;
      }
    }

    let buttons;
    const yesButton = m('.yes-button', [
      m(Button, {
        intent: 'positive',
        disabled: !canVote || hasVotedYes || votingModalOpen,
        onclick: voteYes,
        label: hasVotedYes ? 'Voted yes' : 'Vote yes',
        compact: true,
        rounded: true,
      }),
    ]);
    const noButton = m('.no-button', [
      m(Button, {
        intent: 'negative',
        disabled: !canVote || hasVotedNo || votingModalOpen,
        onclick: voteNo,
        label: hasVotedNo ? 'Voted no' : 'Vote no',
        compact: true,
        rounded: true,
      })
    ]);
    // substrate: multi-deposit approve
    const multiDepositApproveButton = m('.approve-button', [
      m(Button, {
        intent: 'positive',
        disabled: !canVote || votingModalOpen,
        onclick: voteYes,
        label: (hasVotedYes && !canVote) ? 'Already approved' : 'Second',
        compact: true,
        rounded: true,
      }),
    ]);
    // cosmos: abstain
    const abstainButton = m('.abstain-button', [
      m(Button, {
        intent: 'warning',
        disabled: !canVote || hasVotedAbstain || votingModalOpen,
        onclick: voteAbstain,
        label: hasVotedAbstain ? 'Abstained' : 'Abstain',
        compact: true,
        rounded: true,
      }),
    ]);
    // cosmos: veto
    const noWithVetoButton = m('.veto-button', [
      m(Button, {
        intent: 'warning',
        disabled: !canVote || hasVotedVeto || votingModalOpen,
        onclick: voteVeto,
        label: hasVotedVeto ? 'Vetoed' : 'Veto',
        compact: true,
        rounded: true,
      }),
    ]);
    // moloch: cancel
    const cancelButton = (proposal.votingType === VotingType.MolochYesNo) ? m('.veto-button', [
      m(Button, {
        intent: 'negative',
        disabled: !((proposal as MolochProposal).canAbort(user) && !(proposal as MolochProposal).completed)
          || votingModalOpen,
        onclick: cancelProposal,
        label: (proposal as MolochProposal).isAborted ? 'Cancelled' : 'Cancel',
        compact: true,
        rounded: true,
      }),
    ]) : (proposal.votingType === VotingType.MarlinYesNo) ? m('.veto-button', [
      m(Button, {
        intent: 'negative',
        disabled: (proposal as MarlinProposal).isCanceled
          || votingModalOpen,
        onclick: cancelProposal,
        label: (proposal as MarlinProposal).isCanceled ? 'Cancelled' : 'Cancel',
        compact: true,
      }),
    ]) : null;
    // V2 only: moloch: sponsor
    // const sponsorButton = (proposal.votingType === VotingType.MolochYesNo) && m('.yes-button', [
    //  m(Button, {
    //    intent: 'positive',
    //    disabled: (proposal as MolochProposal).state.sponsored
    //      || (proposal as MolochProposal).state.processed
    //      || votingModalOpen
    //    onclick: sponsorProposal,
    //    label: (proposal as MolochProposal).state.sponsored ? 'Sponsered' : 'Sponsor',
    //    compact: true,
    //    rounded: true,
    //  }),
    // ]);
    // moloch: process
    const processButton = (proposal.votingType === VotingType.MolochYesNo) && m('.yes-button', [
      m(Button, {
        intent: 'none',
        disabled: (proposal as MolochProposal).state !== MolochProposalState.ReadyToProcess || votingModalOpen,
        onclick: processProposal,
        label: (proposal as MolochProposal).data.processed ? 'Processed' : 'Process',
        compact: true,
        rounded: true,
      })
    ]);

    let votingActionObj;
    if (proposal.votingType === VotingType.SimpleYesNoVoting) {
      votingActionObj = [
        m('.button-row', [yesButton, noButton]),
        m(ProposalExtensions, { proposal }),
      ];
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      votingActionObj = [
        m('.button-row', [yesButton, noButton]),
        m(ProposalExtensions, {
          proposal,
          setDemocracyVoteConviction: (c) => { vnode.state.conviction = c; },
          setDemocracyVoteAmount: (c) => { vnode.state.amount = c; },
        }),
      ];
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
      votingActionObj = [
        m('.button-row', multiDepositApproveButton),
        m(ProposalExtensions, { proposal }),
      ];
    } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
      votingActionObj = [
        m('.button-row', [yesButton, noButton, abstainButton, noWithVetoButton]),
        m(ProposalExtensions, { proposal }),
      ];
    } else if (proposal.votingType === VotingType.MultiOptionVoting && buttons.length > 0) {
      votingActionObj = [
        m('button-row', buttons),
        m(ProposalExtensions, { proposal }),
      ];
    } else if (proposal.votingType === VotingType.MolochYesNo) {
      votingActionObj = [
        [ m('.button-row', [yesButton, noButton, /* sponsorButton, */processButton, cancelButton]),
          m(ProposalExtensions, { proposal }) ]
      ];
    } else if (proposal.votingType === VotingType.MarlinYesNo) {
      votingActionObj = [
        m('.button-row', [yesButton, noButton, /** executeButton, queueButton, */ cancelButton])
      ];
    } else if (proposal.votingType === VotingType.RankedChoiceVoting) {
      votingActionObj = m(CannotVote, { action: 'Unsupported proposal type' });
    } else if (proposal.votingType === VotingType.None) {
      votingActionObj = m(CannotVote, { action: 'Unsupported proposal type' });
    } else {
      votingActionObj = m(CannotVote, { action: 'Unsupported proposal type' });
    }

    return m('.VotingActions', [votingActionObj]);
  },
};

export default VotingActions;
