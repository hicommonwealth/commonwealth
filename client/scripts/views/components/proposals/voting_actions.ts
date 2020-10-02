import 'components/proposals/voting_actions.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { hexToUtf8 } from 'web3-utils';
import { Button } from 'construct-ui';

import app from 'state';
import { CosmosVoteChoice } from 'adapters/chain/cosmos/types';
import { CosmosAccount } from 'controllers/chain/cosmos/account';
import { CosmosVote, CosmosProposal } from 'controllers/chain/cosmos/proposal';
import { ProposalStatus, BinaryVote, DepositVote, VotingType, AnyProposal } from 'models';
import { SubstrateDemocracyReferendum, convictionToWeight } from 'controllers/chain/substrate/democracy_referendum';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import {
  EdgewareSignalingProposal, SignalingProposalStage, SignalingVote
} from 'controllers/chain/edgeware/signaling_proposal';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { CountdownUntilBlock } from 'views/components/countdown';
import { ConvictionsChooser } from 'views/components/proposals/convictions_table';
import { createTXModal } from 'views/modals/tx_signing_modal';
import Edgeware from 'controllers/chain/edgeware/main';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateChain from 'controllers/chain/substrate/shared';
import { SubstratePhragmenElection } from 'controllers/chain/substrate/phragmen_election';
import MolochProposal, {
  MolochProposalVote,
  MolochVote,
  MolochProposalState
} from 'controllers/chain/ethereum/moloch/proposal';
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
          compact: true,
        }),
      ]),
    ]);
  }
};

const ProposalExtensions: m.Component<{ proposal, callback?, setConviction? }> = {
  view: (vnode) => {
    const proposal = vnode.attrs.proposal;
    const callback = vnode.attrs.callback;
    const user: SubstrateAccount = app.user.activeAccount as SubstrateAccount;
    if (vnode.attrs.proposal instanceof EdgewareSignalingProposal) {
      const advanceSignalingProposal = (e) => {
        e.preventDefault();
        const acct = app.user.activeAccount as SubstrateAccount;
        createTXModal((app.chain as Edgeware).signaling.advance(acct, proposal as EdgewareSignalingProposal));
      };

      let proposalStageMsg;
      if (proposal.stage === SignalingProposalStage.PreVoting) {
        proposalStageMsg = 'Turn on signaling';
      } else if (proposal.stage === SignalingProposalStage.Voting) {
        proposalStageMsg = 'Signaling open';
      } else {
        proposalStageMsg = 'Signaling closed';
      }

      return m('.ProposalExtensions', [
        proposal.stage === SignalingProposalStage.PreVoting
          && 'The proposal creator has not turned on signaling yet.',
        proposal.stage === SignalingProposalStage.Voting && [
          `Signaling open through block ${proposal.endTime.blocknum} (`,
          m(CountdownUntilBlock, { block: proposal.endTime.blocknum }),
          ')',
        ],
        proposal.stage === SignalingProposalStage.Completed
          && 'Signaling proposal complete.',
        (proposal.data.author === user.address)
          && m(Button, {
            intent: 'positive',
            disabled: (proposal.stage !== SignalingProposalStage.PreVoting),
            onclick: advanceSignalingProposal,
            label: proposalStageMsg,
            compact: true,
          }),
      ]);
    } else if (vnode.attrs.proposal instanceof SubstrateDemocracyReferendum) {
      if (!vnode.attrs.setConviction) return;
      return m('.ProposalExtensions', [
        m('strong', 'Conviction voting'),
        m('div', { style: 'margin-top: 6px' }, [
          'The winning side\'s coins will be timelocked according to the weight of their vote:'
        ]),
        m(ConvictionsChooser, { callback: vnode.attrs.setConviction }),
      ]);
    } else if (vnode.attrs.proposal instanceof SubstrateDemocracyProposal) {
      return m('.ProposalExtensions', [
        m('p', 'Cost to second: ', proposal.deposit.format())
      ]);
    } else if (vnode.attrs.proposal instanceof SubstratePhragmenElection) {
      const votingBond = (app.chain as Substrate).phragmenElections.votingBond;
      return m('.ProposalExtensions', [
        'Voting on councillor candidacies requires a voting bond of ',
        m('strong', votingBond ? votingBond.format() : '--'),
        ', which is returned when the election is completed.',
        // TODO XXX: check whether user has deposited a voting bond
        // m('p', 'You have not deposited a voting bond for the current election.'),
        // m('p', 'You have already deposited a voting bond for the current election.'),
      ]);
    }
  }
};

const ProposalVotingActions: m.Component<{ proposal: AnyProposal }, { conviction, votingModalOpen: boolean }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    const { votingModalOpen } = vnode.state;
    if (proposal instanceof SubstrateTreasuryProposal) {
      return m(CannotVote, { action: 'Send to council or democracy' });
    } else if (!app.isLoggedIn()) {
      return m(CannotVote, { action: 'Log in to vote' });
    } else if (!app.user.activeAccount) {
      return m(CannotVote, { action: 'Connect an address to vote' });
    } else if (!proposal.canVoteFrom(app.user.activeAccount)) {
      return m(CannotVote, { action: 'Cannot vote from this address' });
    }

    let user;
    if (proposal instanceof EdgewareSignalingProposal
        || proposal instanceof SubstrateDemocracyProposal
        || proposal instanceof SubstrateDemocracyReferendum
        || proposal instanceof SubstratePhragmenElection
        || proposal instanceof SubstrateCollectiveProposal) {
      user = app.user.activeAccount as SubstrateAccount;
    } else if (proposal instanceof CosmosProposal) {
      user = app.user.activeAccount as CosmosAccount;
    } else if (proposal instanceof MolochProposal) {
      user = app.user.activeAccount as EthereumAccount;
    } else {
      return m(CannotVote, { action: 'Unrecognized proposal type' });
    }

    const onModalClose = () => {
      vnode.state.votingModalOpen = false;
      m.redraw();
    }

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
        createTXModal(proposal.submitVoteTx(new DepositVote(user, proposal.deposit), onModalClose)); // TODO: new code, test
      } else if (proposal instanceof SubstrateDemocracyReferendum) {
        if (vnode.state.conviction === undefined) throw new Error('Must select a conviction');
        createTXModal(proposal.submitVoteTx(
          new BinaryVote(user, true, convictionToWeight(vnode.state.conviction)), onModalClose
        ));
      } else if (proposal instanceof SubstrateCollectiveProposal) {
        createTXModal(proposal.submitVoteTx(new BinaryVote(user, true), onModalClose));
      } else if (proposal instanceof CosmosProposal) {
        createTXModal(proposal.submitVoteTx(new CosmosVote(user, CosmosVoteChoice.YES), null, onModalClose));
      } else if (proposal instanceof MolochProposal) {
        proposal.submitVoteWebTx(new MolochProposalVote(user, MolochVote.YES))
          .then(() => m.redraw())
          .catch((err) => notifyError(err.toString()));
      } else if (proposal instanceof SubstratePhragmenElection) {
        throw new Error('Unimplemented proposal type - use election voting modal');
      } else {
        throw new Error('Invalid proposal type');
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
      if (proposal instanceof EdgewareSignalingProposal) {
        createTXModal(proposal.submitVoteTx(new SignalingVote(proposal, user, [
          (app.chain.chain as SubstrateChain).createType('VoteOutcome', [0])
        ], app.chain.chain.coins(0)), onModalClose)); // fake balance, not needed for voting
      } else if (proposal instanceof SubstrateDemocracyReferendum) {
        if (vnode.state.conviction === undefined) throw new Error('Must select a conviction'); // TODO: new code, test
        createTXModal(proposal.submitVoteTx(new BinaryVote(user, false,
          convictionToWeight(vnode.state.conviction)), onModalClose));
      } else if (proposal instanceof SubstrateCollectiveProposal) {
        createTXModal(proposal.submitVoteTx(new BinaryVote(user, false), onModalClose));
      } else if (proposal instanceof CosmosProposal) {
        createTXModal(proposal.submitVoteTx(new CosmosVote(user, CosmosVoteChoice.NO), null, onModalClose));
      } else if (proposal instanceof MolochProposal) {
        proposal.submitVoteWebTx(new MolochProposalVote(user, MolochVote.NO)).then(() => m.redraw());
      } else {
        throw new Error('Invalid proposal type');
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
      } else {
        throw new Error('Invalid proposal type');
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
    //     throw new Error('Invalid proposal type');
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
        onModalClose()
        throw new Error('Invalid proposal type');
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
        createTXModal(proposal.submitVoteTx(new CosmosVote(user, CosmosVoteChoice.ABSTAIN), null, onModalClose));
      } else {
        throw new Error('Invalid proposal type');
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
        createTXModal(proposal.submitVoteTx(new CosmosVote(user, CosmosVoteChoice.VETO), null, onModalClose));
      } else {
        throw new Error('Invalid proposal type');
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
      if (proposal instanceof EdgewareSignalingProposal) {
        createTXModal(proposal.submitVoteTx(new SignalingVote(proposal, user, [
          (app.chain.chain as SubstrateChain).createType('VoteOutcome', choice)
        ], app.chain.chain.coins(0)), onModalClose)); // fake balance, not needed for voting
      }
    };

    let hasVotedYes;
    let hasVotedNo;
    let hasVotedAbstain;
    let hasVotedVeto;
    let hasVotedForAnyChoice;
    const hasVotedForChoice = {};
    if (proposal instanceof EdgewareSignalingProposal) {
      const choices = proposal.data.choices;
      choices.forEach((c) => { hasVotedForChoice[c.toHex()] = false; });
      proposal.getVotes().forEach((vote) => {
        if (vote.account.address === user.address) {
          hasVotedForChoice[vote.choices[0].toHex()] = true;
          hasVotedForAnyChoice = user && true;
        }
      });

      const yVote = (app.chain.chain as SubstrateChain).createType('VoteOutcome', [1]);
      const nVote = (app.chain.chain as SubstrateChain).createType('VoteOutcome', [0]);
      hasVotedYes = user && proposal
        .getVotes()
        .filter((vote) => vote.choices[0].toHex() === yVote.toHex()
          && vote.account.address === user.address).length > 0;
      hasVotedNo = user && proposal
        .getVotes()
        .filter((vote) => vote.choices[0].toHex() === nVote.toHex()
          && vote.account.address === user.address).length > 0;
    } else if (proposal instanceof SubstrateDemocracyProposal) {
      hasVotedYes = proposal.getVotes().filter((vote) => {
        return vote.account.address === user.address;
      }).length > 0;
      hasVotedForAnyChoice = hasVotedYes;
    } else if (proposal instanceof CosmosProposal) {
      hasVotedYes = user && proposal.getVotes()
        .filter((vote) => vote.choice === CosmosVoteChoice.YES && vote.account.address === user.address).length > 0;
      hasVotedNo = user && proposal.getVotes()
        .filter((vote) => vote.choice === CosmosVoteChoice.NO && vote.account.address === user.address).length > 0;
      hasVotedAbstain = user && proposal.getVotes()
        .filter((vote) => vote.choice === CosmosVoteChoice.ABSTAIN && vote.account.address === user.address).length > 0;
      hasVotedVeto = user && proposal.getVotes()
        .filter((vote) => vote.choice === CosmosVoteChoice.VETO && vote.account.address === user.address).length > 0;
    } else if (proposal instanceof MolochProposal) {
      hasVotedYes = user && proposal.getVotes()
        .filter((vote) => vote.choice === MolochVote.YES && vote.account.address === user.address).length > 0;
      hasVotedNo = user && proposal.getVotes()
        .filter((vote) => vote.choice === MolochVote.NO && vote.account.address === user.address).length > 0;
    }

    let canVote = true;
    if (proposal.completed) {
      canVote = false;
    } else if (proposal.isPassing === ProposalStatus.Passed || proposal.isPassing === ProposalStatus.Failed) {
      canVote = false;
    } else if (proposal instanceof EdgewareSignalingProposal && proposal.stage !== SignalingProposalStage.Voting) {
      canVote = false;
    } else if (proposal instanceof MolochProposal && proposal.state !== MolochProposalState.Voting) {
      canVote = false;
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
    if (proposal instanceof EdgewareSignalingProposal) {
      const { choices } = (proposal as EdgewareSignalingProposal).data;
      buttons = choices.map((c, inx) => {
        let cl;
        if (choices.length > 2) {
          cl = ['.yes-button', 'positive'];
        } else if (inx === 1) {
          cl = ['.no-button', 'negative'];
        } else {
          cl = ['.yes-button', 'positive'];
        }

        return m(`${cl[0]}`, [
          m(Button, {
            intent: cl[1],
            disabled: !canVote || hasVotedForChoice[c.toHex()] || votingModalOpen,
            onclick: (e) => voteForChoice(e, c),
            label: hasVotedForChoice[c.toHex()]
              ? `Voted ${hexToUtf8(c.toHex())}`
              : `Vote ${hexToUtf8(c.toHex())}`,
            compact: true,
          }),
        ]);
      });
    }
    const yesButton = m('.yes-button', [
      m(Button, {
        intent: 'positive',
        disabled: !canVote || hasVotedYes || votingModalOpen,
        onclick: voteYes,
        label: hasVotedYes ? 'Voted yes' : 'Vote yes',
        compact: true,
      }),
    ]);
    const noButton = m('.no-button', [
      m(Button, {
        intent: 'negative',
        disabled: !canVote || hasVotedNo || votingModalOpen,
        onclick: voteNo,
        label: hasVotedNo ? 'Voted no' : 'Vote no',
        compact: true,
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
      }),
    ]);
    // cosmos: abstain
    const abstainButton = m('.abstain-button', [
      m(Button, {
        intent: 'none',
        disabled: !canVote || hasVotedAbstain || votingModalOpen,
        onclick: voteAbstain,
        label: hasVotedAbstain ? 'Voted abstain' : 'Vote abstain',
        compact: true,
      }),
    ]);
    // cosmos: abstain
    const noWithVetoButton = m('.veto-button', [
      m(Button, {
        intent: 'negative',
        disabled: !canVote || hasVotedVeto || votingModalOpen,
        onclick: voteVeto,
        label: hasVotedVeto ? 'Vetoed' : 'Veto',
        compact: true,
      }),
    ]);
    // moloch: cancel
    const cancelButton = (proposal.votingType === VotingType.MolochYesNo) && m('.veto-button', [
      m(Button, {
        intent: 'negative',
        disabled: !((proposal as MolochProposal).canAbort(user) && !(proposal as MolochProposal).completed)
          || votingModalOpen,
        onclick: cancelProposal,
        label: (proposal as MolochProposal).isAborted ? 'Cancelled' : 'Cancel',
        compact: true,
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
      })
    ]);

    let votingActionObj;
    if (proposal.votingType === VotingType.SimpleYesNoVoting && !(proposal instanceof EdgewareSignalingProposal)) {
      votingActionObj = [
        m('.button-row', [yesButton, noButton]),
        m(ProposalExtensions, { proposal }),
      ];
    } else if (proposal.votingType === VotingType.ConvictionYesNoVoting) {
      votingActionObj = [
        m('.button-row', [yesButton, noButton]),
        m(ProposalExtensions, {
          proposal,
          setConviction: (c) => { vnode.state.conviction = c; },
        }),
      ];
    } else if (proposal.votingType === VotingType.SimpleYesApprovalVoting) {
      votingActionObj = [
        m('.button-row', multiDepositApproveButton),
        m(ProposalExtensions, { proposal }),
      ];
    } else if (proposal.votingType === VotingType.YesNoAbstainVeto) {
      votingActionObj = [
        m('.button-row', [yesButton, abstainButton, noButton, noWithVetoButton]),
        m(ProposalExtensions, { proposal }),
      ];
    } else if (proposal.votingType === VotingType.SimpleYesNoVoting
               && (proposal instanceof EdgewareSignalingProposal)
               && buttons.length === 2) {
      votingActionObj = [
        m('button-row', buttons),
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

export default ProposalVotingActions;
