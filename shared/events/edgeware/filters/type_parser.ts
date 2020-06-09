import { SubstrateEventKind } from '../types';

/**
 * This is the Type Parser function, which takes a raw Substrate chain Event
 * and determines which of our local event kinds it belongs to.
 */
export default function (
  versionName: string,
  versionNumber: number,
  section: string,
  method: string,
): SubstrateEventKind | null {
  // TODO: we can unify this with the enricher file: parse out the kind, and then
  //   marshall the rest of the types in the same place. But for now, we can leave as-is.
  switch (section) {
    case 'staking':
      switch (method) {
        case 'Slash': return SubstrateEventKind.Slash;
        case 'Reward': return SubstrateEventKind.Reward;
        // NOTE: these are not supported yet on Edgeware, only kusama and edgeware-develop
        case 'Bonded': return SubstrateEventKind.Bonded;
        case 'Unbonded': return SubstrateEventKind.Unbonded;
        default: return null;
      }
    case 'democracy':
      switch (method) {
        case 'Proposed': return SubstrateEventKind.DemocracyProposed;
        case 'Tabled': return SubstrateEventKind.DemocracyTabled;
        case 'Started': return SubstrateEventKind.DemocracyStarted;
        case 'Passed': return SubstrateEventKind.DemocracyPassed;
        case 'NotPassed': return SubstrateEventKind.DemocracyNotPassed;
        case 'Cancelled': return SubstrateEventKind.DemocracyCancelled;
        case 'Executed': return SubstrateEventKind.DemocracyExecuted;
        case 'Delegated': return SubstrateEventKind.VoteDelegated;
        case 'PreimageNoted': return SubstrateEventKind.PreimageNoted;
        case 'PreimageUsed': return SubstrateEventKind.PreimageUsed;
        case 'PreimageInvalid': return SubstrateEventKind.PreimageInvalid;
        case 'PreimageMissing': return SubstrateEventKind.PreimageMissing;
        case 'PreimageReaped': return SubstrateEventKind.PreimageReaped;
        default: return null;
      }
    case 'treasury':
      switch (method) {
        case 'Proposed': return SubstrateEventKind.TreasuryProposed;
        case 'Awarded': return SubstrateEventKind.TreasuryAwarded;
        case 'Rejected': return SubstrateEventKind.TreasuryRejected;
        default: return null;
      }
    case 'elections':
    case 'electionsPhragmen':
      switch (method) {
        case 'submitCandidacy': return SubstrateEventKind.ElectionCandidacySubmitted;
        case 'NewTerm': return SubstrateEventKind.ElectionNewTerm;
        case 'EmptyTerm': return SubstrateEventKind.ElectionEmptyTerm;
        case 'MemberKicked': return SubstrateEventKind.ElectionMemberKicked;
        case 'MemberRenounced': return SubstrateEventKind.ElectionMemberRenounced;
        default: return null;
      }
    case 'collective':
    case 'council':
    case 'technicalCollective':
      switch (method) {
        case 'Proposed': return SubstrateEventKind.CollectiveProposed;
        case 'Voted': return SubstrateEventKind.CollectiveVoted;
        case 'Approved': return SubstrateEventKind.CollectiveApproved;
        case 'Disapproved': return SubstrateEventKind.CollectiveDisapproved;
        case 'Executed': return SubstrateEventKind.CollectiveExecuted;
        case 'MemberExecuted': return SubstrateEventKind.CollectiveMemberExecuted;
        default: return null;
      }
    case 'signaling':
      switch (method) {
        case 'NewProposal': return SubstrateEventKind.SignalingNewProposal;
        case 'CommitStarted': return SubstrateEventKind.SignalingCommitStarted;
        case 'VotingStarted': return SubstrateEventKind.SignalingVotingStarted;
        case 'VotingCompleted': return SubstrateEventKind.SignalingVotingCompleted;
        default: return null;
      }
    case 'treasuryReward':
      switch (method) {
        // case 'TreasuryMinting': {
        //   if (versionNumber < 34) {
        //     return SubstrateEventKind.TreasuryRewardMinting;
        //   } else {
        //     return SubstrateEventKind.TreasuryRewardMintingV2;
        //   }
        // }
        default: return null;
      }
    default:
      return null;
  }
}
