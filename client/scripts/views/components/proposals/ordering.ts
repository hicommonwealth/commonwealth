import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective';
//import { EdgewareCandidacy } from 'controllers/chain/substrate/elections';

// Proposal ordering helpers. These should be in helpers, but
// there seems to be a circular dependency issue.

export const orderProposalsByType = (p1, p2) => {
  const proposalClassToOrder = (proposalType) => {
    switch (proposalType) {
    case SubstrateDemocracyReferendum:
      return 1;
    case SubstrateCollectiveProposal:
      return 2;
    case SubstrateDemocracyProposal:
      return 3;
      return 4;
    // case EdgewareCandidacy:
    //   return null;
    }
  };
  if (proposalClassToOrder(p1) !== proposalClassToOrder(p2)) {
    return proposalClassToOrder(p1) - proposalClassToOrder(p2);
  } else {
    return p1.endTime - p2.endTime;
  }
};

export const orderProposalsByEndTime = (p1, p2) => {
  if (p1.endTime() && p2.endTime === undefined) return -1;
  if (p1.endTime() === undefined && p2.endTime) return 1;
  return (+p1.endTime) - (+p2.endTime);
};

export const orderProposalsByAmountVoted = (p1, p2) => {
  // if (p1 instanceof BinaryVotingProposal && p2 instanceof BinaryVotingProposal) {
  //   return +p1.getEDGVoted().sub(p2.getEDGVoted());
  // }
  // if (p1 instanceof ApprovalVotingProposal && p2 instanceof ApprovalVotingProposal) {
  //   return +p1.getEDGApproving().sub(p2.getEDGApproving());
  // }
  // Otherwise, just count number of votes
  return p1.getVotes().length - p2.getVotes().length;
};
