import m from 'mithril';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { AnyProposal, IVote, VotingUnit, ProposalStatus } from 'models';
import { CosmosProposal, CosmosVote } from 'controllers/chain/cosmos/proposal';
import AaveProposal, {
  AaveProposalVote,
} from 'controllers/chain/ethereum/aave/proposal';
import MolochProposal, {
  MolochProposalState,
  MolochVote,
} from 'controllers/chain/ethereum/moloch/proposal';
import CompoundProposal, {
  BravoVote,
  CompoundProposalVote,
} from 'controllers/chain/ethereum/compound/proposal';
import { notifyError } from 'controllers/app/notifications';
import { CompoundTypes } from 'chain-events/src';
import NearSputnikProposal from 'controllers/chain/near/sputnik/proposal';
import {
  NearSputnikProposalStatus,
  NearSputnikVoteString,
} from 'controllers/chain/near/sputnik/types';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstratePhragmenElection } from 'controllers/chain/substrate/phragmen_election';

export const getBalance = (proposal: AnyProposal, vote: IVote<any>) => {
  const balancesCache = {};
  const balancesCacheInitialized = {};

  const balanceWeighted =
    proposal.votingUnit === VotingUnit.CoinVote ||
    proposal.votingUnit === VotingUnit.ConvictionCoinVote ||
    proposal.votingUnit === VotingUnit.PowerVote;

  let balance;

  if (balanceWeighted && !(vote instanceof CosmosVote)) {
    // fetch and display balances
    if (balancesCache[vote.account.address]) {
      balance = balancesCache[vote.account.address];
    } else if (balancesCacheInitialized[vote.account.address]) {
      // do nothing, fetch already in progress
      balance = '--';
    } else {
      // fetch balance and store in cache
      balancesCacheInitialized[vote.account.address] = true;

      if (vote instanceof AaveProposalVote) {
        balance = vote.power;
        balancesCache[vote.account.address] = vote.format();
        m.redraw();
      } else if (vote instanceof CompoundProposalVote) {
        balance = formatCoin(app.chain.chain.coins(vote.power), true);
        balancesCache[vote.account.address] = balance;
        m.redraw();
      } else {
        vote.account.balance.then((b) => {
          balance = b;
          balancesCache[vote.account.address] = formatCoin(b, true);
          m.redraw();
        });
        balance = '--';
      }
    }
  }

  return balance;
};

export const cancelProposal = (
  e: Event,
  votingModalOpen: boolean,
  proposal: AnyProposal,
  onModalClose: () => void
) => {
  e.preventDefault();
  votingModalOpen = true;

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
    onModalClose();
    return notifyError('Invalid proposal type');
  }
};

export const getCanVote = (
  proposal: AnyProposal,
  hasVotedForAnyChoice: boolean
) => {
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

  return canVote;
};

export const getVotingResults = (proposal: AnyProposal, user) => {
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
        .find((vote) => !vote.choice && vote.account.address === user.address);
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

  return {
    hasVotedYes,
    hasVotedNo,
    hasVotedAbstain,
    hasVotedVeto,
    hasVotedForAnyChoice,
    hasVotedRemove,
  };
};
