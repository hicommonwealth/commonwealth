import { EventKind } from '../types';

/**
 * This is the Type Parser function, which takes a raw Substrate chain Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType (
  versionName: string,
  versionNumber: number,
  section: string,
  method: string,
): EventKind | null {
  // TODO: we can unify this with the enricher file: parse out the kind, and then
  //   marshall the rest of the types in the same place. But for now, we can leave as-is.
  switch (section) {
    case 'imOnline':
      switch (method) {
        case 'AllGood': return EventKind.AllGood;
        case 'HeartbeatReceived': return EventKind.HeartbeatReceived;
        case 'SomeOffline': return EventKind.SomeOffline;
        default: return null;
      }

    case 'session':
      switch (method) {
        case 'NewSession': return EventKind.NewSession;
        default: return null;
      }

    case 'staking':
      switch (method) {
        case 'Slash': return EventKind.Slash;
        case 'Reward': return EventKind.Reward;
        // NOTE: these are not supported yet on Edgeware, only kusama and edgeware-develop
        case 'Bonded': return EventKind.Bonded;
        case 'Unbonded': return EventKind.Unbonded;
        default: return null;
      }
    case 'democracy':
      switch (method) {
        case 'Proposed': return EventKind.DemocracyProposed;
        case 'Tabled': return EventKind.DemocracyTabled;
        case 'Started': return EventKind.DemocracyStarted;
        case 'Passed': return EventKind.DemocracyPassed;
        case 'NotPassed': return EventKind.DemocracyNotPassed;
        case 'Cancelled': return EventKind.DemocracyCancelled;
        case 'Executed': return EventKind.DemocracyExecuted;
        case 'Delegated': return EventKind.VoteDelegated;
        case 'PreimageNoted': return EventKind.PreimageNoted;
        case 'PreimageUsed': return EventKind.PreimageUsed;
        case 'PreimageInvalid': return EventKind.PreimageInvalid;
        case 'PreimageMissing': return EventKind.PreimageMissing;
        case 'PreimageReaped': return EventKind.PreimageReaped;
        default: return null;
      }
    case 'treasury':
      switch (method) {
        case 'Proposed': return EventKind.TreasuryProposed;
        case 'Awarded': return EventKind.TreasuryAwarded;
        case 'Rejected': return EventKind.TreasuryRejected;
        default: return null;
      }
    case 'elections':
    case 'electionsPhragmen':
      switch (method) {
        case 'submitCandidacy': return EventKind.ElectionCandidacySubmitted;
        case 'NewTerm': return EventKind.ElectionNewTerm;
        case 'EmptyTerm': return EventKind.ElectionEmptyTerm;
        case 'MemberKicked': return EventKind.ElectionMemberKicked;
        case 'MemberRenounced': return EventKind.ElectionMemberRenounced;
        default: return null;
      }
    case 'collective':
    case 'council':
    case 'technicalCollective':
      switch (method) {
        case 'Proposed': return EventKind.CollectiveProposed;
        case 'Voted': return EventKind.CollectiveVoted;
        case 'Approved': return EventKind.CollectiveApproved;
        case 'Disapproved': return EventKind.CollectiveDisapproved;
        case 'Executed': return EventKind.CollectiveExecuted;
        case 'MemberExecuted': return EventKind.CollectiveMemberExecuted;
        default: return null;
      }
    case 'signaling':
      switch (method) {
        case 'NewProposal': return EventKind.SignalingNewProposal;
        case 'CommitStarted': return EventKind.SignalingCommitStarted;
        case 'VotingStarted': return EventKind.SignalingVotingStarted;
        case 'VotingCompleted': return EventKind.SignalingVotingCompleted;
        default: return null;
      }
    case 'treasuryReward':
      switch (method) {
        case 'TreasuryMinting': {
          if (versionNumber < 34) {
            return EventKind.TreasuryRewardMinting;
          } else {
            return EventKind.TreasuryRewardMintingV2;
          }
        }
        default: return null;
      }
    case 'identity': {
      switch (method) {
        case 'IdentitySet': return EventKind.IdentitySet;
        case 'JudgementGiven': return EventKind.JudgementGiven;
        case 'IdentityCleared': return EventKind.IdentityCleared;
        case 'IdentityKilled': return EventKind.IdentityKilled;
        default: return null;
      }
    }
    case 'offences': {
      switch (method) {
        case 'Offence': return EventKind.Offence;
        default: return null;
      }
    }
    default:
      return null;
  }
}
