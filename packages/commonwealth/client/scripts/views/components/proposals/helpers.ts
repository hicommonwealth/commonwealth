import { formatCoin } from 'adapters/currency';
import {
  CosmosProposal,
  CosmosVote,
} from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import type { IVote } from '../../../models/interfaces';
import type { AnyProposal } from '../../../models/types';
import { ProposalStatus, VotingUnit } from '../../../models/types';

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
      vote.account.balance.then((b) => {
        balance = b;
        balancesCache[vote.account.address] = formatCoin(b, true);
      });
      balance = '--';
    }
  }

  return balance;
};

export const getCanVote = (
  proposal: AnyProposal,
  hasVotedForAnyChoice: boolean,
) => {
  let canVote = true;

  if (proposal.completed) {
    canVote = false;
  } else if (
    proposal.isPassing !== ProposalStatus.Passing &&
    proposal.isPassing !== ProposalStatus.Failing
  ) {
    canVote = false;
  } else if (hasVotedForAnyChoice) {
    canVote = false;
  }

  return canVote;
};

export const getVotingResults = (proposal: AnyProposal, user) => {
  let hasVotedYes;
  let hasVotedNo;
  let hasVotedAbstain;
  let hasVotedVeto;

  if (proposal instanceof CosmosProposal) {
    hasVotedYes =
      user &&
      proposal
        .getVotes()
        .filter(
          (vote) =>
            vote.choice === 'Yes' && vote.account.address === user.address,
        ).length > 0;

    hasVotedNo =
      user &&
      proposal
        .getVotes()
        .filter(
          (vote) =>
            vote.choice === 'No' && vote.account.address === user.address,
        ).length > 0;

    hasVotedAbstain =
      user &&
      proposal
        .getVotes()
        .filter(
          (vote) =>
            vote.choice === 'Abstain' && vote.account.address === user.address,
        ).length > 0;

    hasVotedVeto =
      user &&
      proposal
        .getVotes()
        .filter(
          (vote) =>
            vote.choice === 'NoWithVeto' &&
            vote.account.address === user.address,
        ).length > 0;
  }

  return {
    hasVotedYes,
    hasVotedNo,
    hasVotedAbstain,
    hasVotedVeto,
  };
};
