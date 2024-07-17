import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import type { AnyProposal } from '../../../models/types';
import { ProposalStatus } from '../../../models/types';

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
  let hasVotedForAnyChoice;

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

    hasVotedForAnyChoice =
      hasVotedYes || hasVotedNo || hasVotedAbstain || hasVotedVeto;
  }

  return {
    hasVotedYes,
    hasVotedNo,
    hasVotedAbstain,
    hasVotedVeto,
    hasVotedForAnyChoice,
  };
};
