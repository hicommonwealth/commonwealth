import BN from 'bn.js';
import { IIdentifiable } from 'adapters/shared';
import { IVote } from 'models';
import { NearAccount } from 'controllers/chain/near/account';
import { NearToken } from 'adapters/chain/near/types';

// eslint-disable-next-line no-shadow
export enum NearSputnikProposalStatus {
  InProgress = 'InProgress',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Removed = 'Removed',
  Expired = 'Expired',
  Moved = 'Moved',
}

// eslint-disable-next-line no-shadow
export enum NearSputnikVoteString {
  Approve = 'Approve',
  Reject = 'Reject',
  Remove = 'Remove',
}

// eslint-disable-next-line no-shadow
export enum WeightKind {
  RoleWeight = 'RoleWeight',
  TokenWeight = 'TokenWeight',
}

type Balance = string;
type AccountId = string;
type U128 = string;
type u64 = string;
type Nanoseconds = string;
export type WeightOrRatio = U128 | [u64, u64];
export function isRatio(r: WeightOrRatio): r is [u64, u64] {
  return r.length === 2;
}
export function isWeight(w: WeightOrRatio): w is U128 {
  return !isRatio(w);
}

export type VotePolicy = {
  weight_kind: WeightKind,

  // Minimum number required for vote to finalize.
  // If weight kind is TokenWeight - this is minimum number of tokens required.
  // If RoleWeight - this is minimum umber of votes.
  quorum: U128, // U128
  threshold: WeightOrRatio,
};

type RoleKind = 'Everyone' | { Member: Balance } | { Group: AccountId[] };
function isMemberRole(r: RoleKind): r is { Member: Balance } {
  return (r as any).Member !== undefined;
}
export function isGroupRole(r: RoleKind): r is { Group: AccountId[] } {
  return (r as any).Group !== undefined;
}

type RolePermission = {
  name: string,
  kind: RoleKind,
  permissions: string[], // e.g. [ *:AddProposal ]
  vote_policy: { [kind: string]: VotePolicy },
};

export type NearSputnikPolicy = {
  roles: RolePermission[],
  default_vote_policy: VotePolicy,
  proposal_bond: U128,
  proposal_period: Nanoseconds,
  bounty_bond: U128,
  bounty_forgiveness_period: Nanoseconds,
};

export function getUserRoles(policy: NearSputnikPolicy, user: AccountId): string[] {
  const userPermissions: string[] = [];
  for (const role of policy.roles) {
    if (role.kind === 'Everyone') {
      userPermissions.push(...role.permissions);
    } else if (isGroupRole(role.kind)) {
      if (role.kind.Group.includes(user)) {
        userPermissions.push(...role.permissions);
      }
    } else {
      // TODO: support Member role
    }
  }
  return userPermissions;
}

export function getTotalSupply(policy: NearSputnikPolicy, votePolicy: VotePolicy, tokenSupply: BN): BN {
  if (votePolicy.weight_kind === WeightKind.RoleWeight) {
    // locate the role representing the proposal's voting group
    const roles = policy.roles;
    for (const role of roles) {
      // TODO: support switching the group based on the proposal settings
      //   rather than taking the first role we come across
      if (isGroupRole(role.kind)) {
        return new BN(role.permissions.length);
      }
    }
  } else {
    return tokenSupply;
  }
}

type NearSputnikActionCall = {
  method_name: string,
  args: any, // TODO: what is this type?
  deposit: U128,
  gas: string, // u64
};

// TODO: support other kinds?
type AddMemberToRole = { AddMemberToRole: { role: string, member_id: AccountId } };
type RemoveMemberFromRole = { RemoveMemberFromRole : { role: string, member_id: AccountId } };
type Transfer = { Transfer: { token_id: AccountId, amount: U128, receiver_id: AccountId, msg?: string } };
type FunctionCall = { FunctionCall: { actions: NearSputnikActionCall[], receiver_id: AccountId } };
type ChangePolicy = { ChangePolicy: { policy: NearSputnikPolicy } };
export type NearSputnikProposalKind = 'ChangeConfig'
  | 'UpgradeSelf'
  | 'UpgradeRemote'
  | 'Transfer'
  | 'SetStakingContract'
  | 'AddBounty'
  | 'BountyDone'
  | 'Vote'
  | ChangePolicy
  | AddMemberToRole
  | RemoveMemberFromRole
  | Transfer
  | FunctionCall;

export function isAddMemberToRole(kind: NearSputnikProposalKind): kind is AddMemberToRole {
  return (kind as any).AddMemberToRole !== undefined;
}
export function isRemoveMemberFromRole(kind: NearSputnikProposalKind): kind is RemoveMemberFromRole {
  return (kind as any).RemoveMemberFromRole !== undefined;
}
export function isTransfer(kind: NearSputnikProposalKind): kind is Transfer {
  return (kind as any).Transfer !== undefined;
}
export function isFunctionCall(kind: NearSputnikProposalKind): kind is FunctionCall {
  return (kind as any).FunctionCall !== undefined;
}
export function isChangePolicy(kind: NearSputnikProposalKind): kind is ChangePolicy {
  return (kind as any).ChangePolicy !== undefined;
}

export function kindToPolicyLabel(kind: NearSputnikProposalKind): string {
  if (kind === 'ChangeConfig') return 'config';
  if (kind === 'UpgradeSelf') return 'upgrade_self';
  if (kind === 'UpgradeRemote') return 'upgrade_remote';
  if (kind === 'Transfer' || isTransfer(kind)) return 'transfer';
  if (kind === 'SetStakingContract') return 'set_vote_token';
  if (kind === 'AddBounty') return 'add_bounty';
  if (kind === 'BountyDone') return 'bounty_done';
  if (kind === 'Vote') return 'vote';
  if (isAddMemberToRole(kind)) return 'add_member_to_role';
  if (isRemoveMemberFromRole(kind)) return 'remove_member_from_role';
  if (isFunctionCall(kind)) return 'call';
  if (isChangePolicy(kind)) return 'policy';
  throw new Error(`invalid proposal kind: ${JSON.stringify(kind)}`);
}
export function getVotePolicy(policy: NearSputnikPolicy, kind: NearSputnikProposalKind): VotePolicy {
  try {
    const policyString = kindToPolicyLabel(kind);
    for (const role of policy.roles) {
      if (role.vote_policy[policyString]) {
        return role.vote_policy[policyString];
      }
    }
  } catch (e) {
    console.error(`Failed to get policy label: ${e.message}`);
  }
  return policy.default_vote_policy;
}

// proposal type returned by get_proposals query
export type NearSputnikGetProposalResponse = {
  id: number,
  description: string,
  // see https://github.com/near-daos/sputnik-dao-contract/blob/master/sputnikdao2/src/proposals.rs#L48
  kind: NearSputnikProposalKind,
  target?: any, // TODO: test what is this type...
  proposer: AccountId,
  status: NearSputnikProposalStatus,
  submission_time: Nanoseconds,
  // who will be e.g. "council" in the case of a class of voters
  vote_counts: { [who: string]: [ number, number, number ] }, // yes / no / remove = spam
  votes: { [who: string]: NearSputnikVoteString, },
};

export type INearSputnikProposal = IIdentifiable & NearSputnikGetProposalResponse;

export class NearSputnikVote implements IVote<NearToken> {
  public readonly account: NearAccount;
  public readonly choice: NearSputnikVoteString;
  public readonly balance: BN;

  constructor(member: NearAccount, choice: NearSputnikVoteString, balance = new BN(1)) {
    this.account = member;
    this.choice = choice;
    this.balance = balance;
  }
}
