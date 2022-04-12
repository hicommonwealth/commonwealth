import 'components/proposals/voting_actions.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { Button, Input } from 'construct-ui';

import app from 'state';
import CosmosAccount from 'controllers/chain/cosmos/account';
import { CosmosVote, CosmosProposal } from 'controllers/chain/cosmos/proposal';
import {
  ProposalStatus,
  BinaryVote,
  DepositVote,
  VotingType,
  AnyProposal,
} from 'models';
import {
  SubstrateDemocracyReferendum,
  convictionToWeight,
} from 'controllers/chain/substrate/democracy_referendum';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { ConvictionsChooser } from 'views/components/proposals/convictions_chooser';
import { BalanceInfo } from 'views/components/proposals/balance_info';
import { createTXModal } from 'views/modals/tx_signing_modal';
import Substrate from 'controllers/chain/substrate/main';
import { SubstratePhragmenElection } from 'controllers/chain/substrate/phragmen_election';
import MolochProposal, {
  MolochProposalVote,
  MolochVote,
  MolochProposalState,
} from 'controllers/chain/ethereum/moloch/proposal';
import CompoundProposal, {
  CompoundProposalVote,
  BravoVote,
} from 'controllers/chain/ethereum/compound/proposal';
import EthereumAccount from 'controllers/chain/ethereum/account';
import { notifyError } from 'controllers/app/notifications';
import AaveProposal, {
  AaveProposalVote,
} from 'controllers/chain/ethereum/aave/proposal';
import { CompoundTypes } from '@commonwealth/chain-events';
import NearSputnikProposal from 'controllers/chain/near/sputnik/proposal';
import Cosmos from 'controllers/chain/cosmos/main';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import {
  NearSputnikProposalStatus,
  NearSputnikVote,
  NearSputnikVoteString,
} from 'controllers/chain/near/sputnik/types';
import { NearAccount } from 'controllers/chain/near/account';

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
  },
};

const ProposalExtensions: m.Component<{
  proposal: AnyProposal;
  setDemocracyVoteConviction?;
  setDemocracyVoteAmount?;
  setCosmosDepositAmount?;
}> = {
  view: (vnode) => {
    const proposal = vnode.attrs.proposal;
    if (proposal instanceof SubstrateDemocracyReferendum) {
      if (!vnode.attrs.setDemocracyVoteConviction) return 'Misconfigured';
      if (!vnode.attrs.setDemocracyVoteAmount) return 'Misconfigured';
      if (!app.user.activeAccount) return 'Misconfigured';
      return m('.ProposalExtensions', [
        m('div', { style: 'font-size: 90%; line-height: 1.2;' }, [
          "The winning side's coins will be timelocked according to the weight of their vote:",
        ]),
        m('div', { style: 'margin: 16px 0 12px;' }, [
          m(ConvictionsChooser, {
            callback: vnode.attrs.setDemocracyVoteConviction,
          }),
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
        app.user.activeAccount instanceof SubstrateAccount &&
          m(BalanceInfo, { account: app.user.activeAccount }),
      ]);
    } else if (proposal instanceof SubstrateDemocracyProposal) {
      return m('.ProposalExtensions', [
        m('.proposal-second', 'Cost to second: ', proposal.deposit.format()),
      ]);
    } else if (proposal instanceof SubstratePhragmenElection) {
      const votingBond = (app.chain as Substrate).phragmenElections.votingBond;
      return m('.ProposalExtensions', [
        'Voting on councillor candidacies requires a voting bond of ',
        m('strong', votingBond ? votingBond.format() : '--'),
        ', which is returned when the election is completed.',
        // TODO XXX: check whether user has deposited a voting bond
        // m('.proposal-bond', 'You have not deposited a voting bond for the current election.'),
        // m('.proposal-bond', 'You have already deposited a voting bond for the current election.'),
      ]);
    } else if (
      proposal instanceof CosmosProposal &&
      proposal.status === 'DepositPeriod'
    ) {
      if (!vnode.attrs.setCosmosDepositAmount) return 'Misconfigured';
      return m('.ProposalExtensions', [
        // m('.proposal-second', 'Must deposit at least: ', (app.chain as Cosmos).governance.minDeposit.format()),
        m(Input, {
          fluid: true,
          class: 'cosmos-proposal-deposit-amount',
          // TODO: support multiple denom
          placeholder: `Amount to deposit (${app.chain?.chain?.denom})`,
          oncreate: (vvnode) => {
            vnode.attrs.setCosmosDepositAmount(0);
          },
          oninput: (e) => {
            vnode.attrs.setCosmosDepositAmount(parseInt(e.target.value, 10));
          },
        }),
        // TODO: balance display
      ]);
    }
  },
};

export const cancelProposal = (e, state, proposal, onModalClose) => {
  e.preventDefault();
  state.votingModalOpen = true;
  mixpanel.track('Proposal Funnel', {
    'Step No': 3,
    Step: 'Cancel Proposal',
    'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
    Scope: app.activeChainId(),
  });
  mixpanel.people.set({
    'Last Thread Created': new Date().toISOString(),
  });
  if (!onModalClose) {
    onModalClose = () => undefined;
  }
  if (proposal instanceof MolochProposal) {
    proposal
      .abortTx()
      .then(() => {
        onModalClose();
        m.redraw();
      })
      .catch((err) => {
        onModalClose();
        console.error(err.toString());
      });
  } else if (proposal instanceof CompoundProposal) {
    proposal
      .cancelTx()
      .then(() => {
        onModalClose();
        m.redraw();
      })
      .catch((err) => {
        onModalClose();
        console.error(err.toString());
      });
  } else if (proposal instanceof AaveProposal) {
    proposal
      .cancelTx()
      .then(() => {
        onModalClose();
        m.redraw();
      })
      .catch((err) => {
        onModalClose();
        console.error(err.toString());
      });
  } else {
    state.votingModalOpen = false;
    return notifyError('Invalid proposal type');
  }
};

// aave: queue / execute
export const QueueButton: m.Component<{ proposal; votingModalOpen? }, {}> = {
  view: (vnode) => {
    const { proposal, votingModalOpen } = vnode.attrs;
    return (
      (proposal instanceof AaveProposal ||
        proposal instanceof CompoundProposal) &&
      proposal.isQueueable &&
      m('.QueueButton', [
        m(Button, {
          intent: 'none',
          disabled: !proposal.isQueueable || votingModalOpen,
          onclick: () => proposal.queueTx().then(() => m.redraw()),
          label:
            proposal.data.queued || proposal.data.executed ? 'Queued' : 'Queue',
          compact: true,
          rounded: true,
        }),
      ])
    );
  },
};

export const ExecuteButton: m.Component<{ proposal; votingModalOpen? }, {}> = {
  view: (vnode) => {
    const { proposal, votingModalOpen } = vnode.attrs;
    return (
      (proposal instanceof AaveProposal ||
        proposal instanceof CompoundProposal) &&
      proposal.isExecutable &&
      m('.ExecuteButton', [
        m(Button, {
          intent: 'none',
          disabled: !proposal.isExecutable || votingModalOpen,
          onclick: () => proposal.executeTx().then(() => m.redraw()),
          label: proposal.data.executed ? 'Executed' : 'Execute',
          compact: true,
          rounded: true,
        }),
      ])
    );
  },
};

// moloch: cancel
export const CancelButton: m.Component<
  { proposal; votingModalOpen?; user?; onModalClose? },
  {}
> = {
  view: (vnode) => {
    const { proposal, votingModalOpen, user, onModalClose } = vnode.attrs;
    return proposal instanceof MolochProposal
      ? m('.veto-button', [
          m(Button, {
            intent: 'negative',
            disabled:
              !(proposal.canAbort(user) && !proposal.completed) ||
              votingModalOpen,
            onclick: (e) =>
              cancelProposal(e, vnode.state, proposal, onModalClose),
            label: proposal.isAborted ? 'Cancelled' : 'Cancel',
            compact: true,
            rounded: true,
          }),
        ])
      : proposal instanceof CompoundProposal
      ? m('.veto-button', [
          m(Button, {
            intent: 'negative',
            disabled: proposal.completed || votingModalOpen,
            onclick: (e) =>
              cancelProposal(e, vnode.state, proposal, onModalClose),
            label: proposal.isCancelled ? 'Cancelled' : 'Cancel',
            compact: true,
          }),
        ])
      : proposal instanceof AaveProposal && proposal.isCancellable
      ? m('.CancelButton', [
          m(Button, {
            disabled: !proposal.isCancellable || votingModalOpen,
            onclick: (e) =>
              cancelProposal(e, vnode.state, proposal, onModalClose),
            label: proposal.data.cancelled ? 'Cancelled' : 'Cancel',
            compact: true,
          }),
        ])
      : null;
  },
};

const VotingActions: m.Component<
  { proposal: AnyProposal },
  {
    conviction: number;
    amount: number;
    votingModalOpen: boolean;
  }
> = {
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
    if (
      proposal instanceof SubstrateDemocracyProposal ||
      proposal instanceof SubstrateDemocracyReferendum ||
      proposal instanceof SubstratePhragmenElection ||
      proposal instanceof SubstrateCollectiveProposal
    ) {
      user = app.user.activeAccount as SubstrateAccount;
    } else if (proposal instanceof CosmosProposal) {
      user = app.user.activeAccount as CosmosAccount;
    } else if (
      proposal instanceof MolochProposal ||
      proposal instanceof CompoundProposal ||
      proposal instanceof AaveProposal
    ) {
      user = app.user.activeAccount as EthereumAccount;
    } else if (proposal instanceof NearSputnikProposal) {
      user = app.user.activeAccount as NearAccount;
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
        Step: 'Vote Yes',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        Scope: app.activeChainId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Vote Created': new Date().toISOString(),
      });
      if (proposal instanceof SubstrateDemocracyProposal) {
        createTXModal(
          proposal.submitVoteTx(
            new DepositVote(user, proposal.deposit),
            onModalClose
          )
        );
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
        createTXModal(
          proposal.submitVoteTx(
            new BinaryVote(
              user,
              true,
              vnode.state.amount,
              convictionToWeight(vnode.state.conviction)
            ),
            onModalClose
          )
        );
      } else if (proposal instanceof SubstrateCollectiveProposal) {
        createTXModal(
          proposal.submitVoteTx(new BinaryVote(user, true), onModalClose)
        );
      } else if (proposal instanceof CosmosProposal) {
        if (proposal.status === 'DepositPeriod') {
          // TODO: configure deposit amount
          proposal
            .submitDepositTx(
              user,
              (app.chain as Cosmos).chain.coins(vnode.state.amount)
            )
            .then(() => m.redraw())
            .catch((err) => notifyError(err.toString()));
        } else {
          proposal
            .voteTx(new CosmosVote(user, 'Yes'))
            .then(() => m.redraw())
            .catch((err) => notifyError(err.toString()));
        }
      } else if (proposal instanceof MolochProposal) {
        proposal
          .submitVoteWebTx(new MolochProposalVote(user, MolochVote.YES))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof CompoundProposal) {
        proposal
          .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.YES))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof AaveProposal) {
        proposal
          .submitVoteWebTx(new AaveProposalVote(user, true))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof NearSputnikProposal) {
        proposal
          .submitVoteWebTx(
            new NearSputnikVote(user, NearSputnikVoteString.Approve)
          )
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof SubstratePhragmenElection) {
        vnode.state.votingModalOpen = false;
        return notifyError(
          'Unimplemented proposal type - use election voting modal'
        );
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
        Step: 'Vote No',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        Scope: app.activeChainId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Vote Created': new Date().toISOString(),
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
        createTXModal(
          proposal.submitVoteTx(
            new BinaryVote(
              user,
              false,
              vnode.state.amount,
              convictionToWeight(vnode.state.conviction)
            ),
            onModalClose
          )
        );
      } else if (proposal instanceof SubstrateCollectiveProposal) {
        createTXModal(
          proposal.submitVoteTx(new BinaryVote(user, false), onModalClose)
        );
      } else if (proposal instanceof CosmosProposal) {
        proposal
          .voteTx(new CosmosVote(user, 'No'))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof MolochProposal) {
        proposal
          .submitVoteWebTx(new MolochProposalVote(user, MolochVote.NO))
          .then(() => m.redraw());
      } else if (proposal instanceof CompoundProposal) {
        proposal
          .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.NO))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof AaveProposal) {
        proposal
          .submitVoteWebTx(new AaveProposalVote(user, false))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof NearSputnikProposal) {
        proposal
          .submitVoteWebTx(
            new NearSputnikVote(user, NearSputnikVoteString.Reject)
          )
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else {
        vnode.state.votingModalOpen = false;
        return notifyError('Invalid proposal type');
      }
    };

    const processProposal = (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = true;
      mixpanel.track('Proposal Funnel', {
        'Step No': 3,
        Step: 'Process Proposal',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        Scope: app.activeChainId(),
      });
      mixpanel.people.set({
        'Last Thread Created': new Date().toISOString(),
      });
      if (proposal instanceof MolochProposal) {
        proposal
          .processTx()
          .then(() => {
            onModalClose();
            m.redraw();
          })
          .catch((err) => {
            onModalClose();
            notifyError(err.toString());
          });
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
        Step: 'Vote Abstain',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        Scope: app.activeChainId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Thread Created': new Date().toISOString(),
      });
      if (proposal instanceof CosmosProposal) {
        proposal
          .voteTx(new CosmosVote(user, 'Abstain'))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (
        proposal instanceof CompoundProposal &&
        (app.chain as Compound).governance.supportsAbstain
      ) {
        proposal
          .submitVoteWebTx(new CompoundProposalVote(user, BravoVote.ABSTAIN))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
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
        Step: 'Vote Veto',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        Scope: app.activeChainId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Thread Created': new Date().toISOString(),
      });
      if (proposal instanceof CosmosProposal) {
        proposal
          .voteTx(new CosmosVote(user, 'NoWithVeto'))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else {
        vnode.state.votingModalOpen = false;
        return notifyError('Invalid proposal type');
      }
    };
    const voteRemove = (e) => {
      e.preventDefault();
      vnode.state.votingModalOpen = true;
      mixpanel.track('Proposal Funnel', {
        'Step No': 3,
        Step: 'Vote Reject',
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        Scope: app.activeChainId(),
      });
      mixpanel.people.increment('Votes');
      mixpanel.people.set({
        'Last Thread Created': new Date().toISOString(),
      });
      if (proposal instanceof NearSputnikProposal) {
        proposal
          .submitVoteWebTx(
            new NearSputnikVote(user, NearSputnikVoteString.Remove)
          )
          .then(() => {
            onModalClose();
            m.redraw();
          })
          .catch((err) => {
            onModalClose();
            notifyError(err.toString());
          });
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
        Step: `Vote for choice ${choice.toString()}`,
        'Proposal Name': `${proposal.slug}: ${proposal.identifier}`,
        Scope: app.activeChainId(),
      });
    };

    let hasVotedYes;
    let hasVotedNo;
    let hasVotedAbstain;
    let hasVotedVeto;
    let hasVotedForAnyChoice;
    let hasVotedRemove;
    if (proposal instanceof SubstrateDemocracyProposal) {
      hasVotedYes =
        proposal.getVotes().filter((vote) => {
          return vote.account.address === user.address;
        }).length > 0;
      hasVotedForAnyChoice = hasVotedYes;
    } else if (proposal instanceof CosmosProposal) {
      hasVotedYes =
        user &&
        proposal
          .getVotes()
          .filter(
            (vote) =>
              vote.choice === 'Yes' && vote.account.address === user.address
          ).length > 0;
      hasVotedNo =
        user &&
        proposal
          .getVotes()
          .filter(
            (vote) =>
              vote.choice === 'No' && vote.account.address === user.address
          ).length > 0;
      hasVotedAbstain =
        user &&
        proposal
          .getVotes()
          .filter(
            (vote) =>
              vote.choice === 'Abstain' && vote.account.address === user.address
          ).length > 0;
      hasVotedVeto =
        user &&
        proposal
          .getVotes()
          .filter(
            (vote) =>
              vote.choice === 'NoWithVeto' &&
              vote.account.address === user.address
          ).length > 0;
    } else if (proposal instanceof MolochProposal) {
      hasVotedYes =
        user &&
        proposal
          .getVotes()
          .filter(
            (vote) =>
              vote.choice === MolochVote.YES &&
              vote.account.address === user.address
          ).length > 0;
      hasVotedNo =
        user &&
        proposal
          .getVotes()
          .filter(
            (vote) =>
              vote.choice === MolochVote.NO &&
              vote.account.address === user.address
          ).length > 0;
    } else if (proposal instanceof CompoundProposal) {
      hasVotedYes =
        user &&
        proposal
          .getVotes()
          .filter(
            (vote) =>
              vote.choice === BravoVote.YES &&
              vote.account.address === user.address
          ).length > 0;
      hasVotedNo =
        user &&
        proposal
          .getVotes()
          .filter(
            (vote) =>
              vote.choice === BravoVote.NO &&
              vote.account.address === user.address
          ).length > 0;
      hasVotedAbstain =
        user &&
        proposal
          .getVotes()
          .filter(
            (vote) =>
              vote.choice === BravoVote.ABSTAIN &&
              vote.account.address === user.address
          ).length > 0;
    } else if (proposal instanceof AaveProposal) {
      hasVotedYes =
        user &&
        proposal
          .getVotes()
          .find((vote) => vote.choice && vote.account.address === user.address);
      hasVotedNo =
        user &&
        proposal
          .getVotes()
          .find(
            (vote) => !vote.choice && vote.account.address === user.address
          );
      hasVotedForAnyChoice = hasVotedYes || hasVotedNo;
    } else if (proposal instanceof NearSputnikProposal) {
      hasVotedYes =
        user &&
        proposal
          .getVotes()
          .find(
            (vote) =>
              vote.choice === NearSputnikVoteString.Approve &&
              vote.account.address === user.address
          );
      hasVotedNo =
        user &&
        proposal
          .getVotes()
          .find(
            (vote) =>
              vote.choice === NearSputnikVoteString.Reject &&
              vote.account.address === user.address
          );
      hasVotedRemove =
        user &&
        proposal
          .getVotes()
          .find(
            (vote) =>
              vote.choice === NearSputnikVoteString.Remove &&
              vote.account.address === user.address
          );
      hasVotedForAnyChoice = hasVotedYes || hasVotedNo || hasVotedRemove;
    }

    let canVote = true;
    if (proposal.completed) {
      canVote = false;
    } else if (
      proposal.isPassing !== ProposalStatus.Passing &&
      proposal.isPassing !== ProposalStatus.Failing
    ) {
      canVote = false;
    } else if (
      proposal instanceof MolochProposal &&
      proposal.state !== MolochProposalState.Voting
    ) {
      canVote = false;
    } else if (
      proposal instanceof CompoundProposal &&
      proposal.state !== CompoundTypes.ProposalState.Active
    ) {
      canVote = false;
    } else if (
      proposal instanceof NearSputnikProposal &&
      (proposal.data.status !== NearSputnikProposalStatus.InProgress ||
        hasVotedForAnyChoice)
    ) {
      canVote = false;
    } else if (hasVotedForAnyChoice) {
      // enable re-voting for particular types
      if (
        proposal instanceof SubstratePhragmenElection ||
        proposal instanceof SubstrateDemocracyProposal ||
        proposal instanceof SubstrateCollectiveProposal
      ) {
        canVote = true;
      } else {
        canVote = false;
      }
    }

    let buttons;
    const yesButton = m('.yes-button', [
      m(Button, {
        disabled: !canVote || hasVotedYes || votingModalOpen,
        onclick: voteYes,
        label: hasVotedYes ? 'Voted yes' : 'Vote yes',
        compact: true,
        rounded: true,
      }),
    ]);
    const noButton = m('.no-button', [
      m(Button, {
        disabled: !canVote || hasVotedNo || votingModalOpen,
        onclick: voteNo,
        label: hasVotedNo ? 'Voted no' : 'Vote no',
        compact: true,
        rounded: true,
      }),
    ]);
    // substrate: multi-deposit approve
    const multiDepositApproveButton = m('.approve-button', [
      m(Button, {
        intent: 'positive',
        disabled: !canVote || votingModalOpen,
        onclick: voteYes,
        label: hasVotedYes && !canVote ? 'Already approved' : 'Second',
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
    const processButton =
      proposal instanceof MolochProposal &&
      m('.yes-button', [
        m(Button, {
          intent: 'none',
          disabled:
            proposal.state !== MolochProposalState.ReadyToProcess ||
            votingModalOpen,
          onclick: processProposal,
          label: proposal.data.processed ? 'Processed' : 'Process',
          compact: true,
          rounded: true,
        }),
      ]);
    // near: remove
    const removeButton =
      proposal instanceof NearSputnikProposal &&
      m('.no-button', [
        m(Button, {
          intent: 'none',
          disabled: !canVote || votingModalOpen,
          onclick: voteRemove,
          label: hasVotedRemove ? 'Voted remove' : 'Vote remove',
          compact: true,
          rounded: true,
        }),
      ]);

    let votingActionObj;
    // TODO: other specialized proposals go at top
    if (proposal instanceof AaveProposal) {
      votingActionObj = [m('.button-row', [yesButton, noButton])];
    } else if (proposal.votingType === VotingType.SimpleYesNoVoting) {
      votingActionObj = [
        m('.button-row', [yesButton, noButton]),
        m(ProposalExtensions, { proposal }),
      ];
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      votingActionObj = [
        m('.button-row', [yesButton, noButton]),
        m(ProposalExtensions, {
          proposal,
          setDemocracyVoteConviction: (c) => {
            vnode.state.conviction = c;
          },
          setDemocracyVoteAmount: (c) => {
            vnode.state.amount = c;
          },
        }),
      ];
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
      votingActionObj = [
        m('.button-row', multiDepositApproveButton),
        m(ProposalExtensions, {
          proposal,
          setCosmosDepositAmount: (c) => {
            vnode.state.amount = c;
          },
        }),
      ];
    } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
      votingActionObj = [
        m('.button-row', [
          yesButton,
          noButton,
          abstainButton,
          noWithVetoButton,
        ]),
        m(ProposalExtensions, { proposal }),
      ];
    } else if (
      proposal.votingType === VotingType.MultiOptionVoting &&
      buttons.length > 0
    ) {
      votingActionObj = [
        m('button-row', buttons),
        m(ProposalExtensions, { proposal }),
      ];
    } else if (proposal.votingType === VotingType.MolochYesNo) {
      votingActionObj = [
        [
          m('.button-row', [
            yesButton,
            noButton,
            /* sponsorButton, */
            processButton,
            m(CancelButton, { proposal, votingModalOpen, user, onModalClose }),
          ]),
          m(ProposalExtensions, { proposal }),
        ],
      ];
    } else if (proposal.votingType === VotingType.CompoundYesNo) {
      votingActionObj = [
        m('.button-row', [
          yesButton,
          noButton,
          // m(QueueButton, { proposal, votingModalOpen }),
          // m(ExecuteButton, { proposal, votingModalOpen }),
          m(CancelButton, { proposal, votingModalOpen, user, onModalClose }),
        ]),
      ];
    } else if (proposal.votingType === VotingType.CompoundYesNoAbstain) {
      votingActionObj = [
        m('.button-row', [
          yesButton,
          noButton,
          abstainButton,
          // m(QueueButton, { proposal, votingModalOpen }),
          // m(ExecuteButton, { proposal, votingModalOpen }),
          m(CancelButton, { proposal, votingModalOpen, user, onModalClose }),
        ]),
      ];
    } else if (proposal.votingType === VotingType.YesNoReject) {
      votingActionObj = [m('.button-row', [yesButton, noButton, removeButton])];
    } else if (proposal.votingType === VotingType.RankedChoiceVoting) {
      votingActionObj = m(CannotVote, { action: 'Unsupported proposal type' });
    } else if (proposal.votingType === VotingType.None) {
      votingActionObj = m(CannotVote, { action: 'Unsupported proposal type' });
    } else {
      votingActionObj = m(CannotVote, { action: 'Unsupported proposal type' });
    }

    return m(
      `.VotingActions${
        proposal instanceof AaveProposal ? '.AaveProposal' : ''
      }`,
      [m('h3', 'Cast Your Vote'), votingActionObj]
    );
  },
};

export default VotingActions;
