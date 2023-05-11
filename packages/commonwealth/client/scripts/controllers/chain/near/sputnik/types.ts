import type { NearToken } from 'adapters/chain/near/types';
import type { IIdentifiable } from 'adapters/shared';
import BN from 'bn.js';
import type { NearAccount } from 'controllers/chain/near/account';
import type { IVote } from '../../../../models/interfaces';

export interface NearSputnikConfig {
  metadata: string;
  name: string;
  purpose: string;
}

export enum NearSputnikProposalStatus {
  InProgress = 'InProgress',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Removed = 'Removed',
  Expired = 'Expired',
  Moved = 'Moved',
}

export enum NearSputnikVoteString {
  Approve = 'Approve',
  Reject = 'Reject',
  Remove = 'Remove',
}

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
  weight_kind: WeightKind;

  // Minimum number required for vote to finalize.
  // If weight kind is TokenWeight - this is minimum number of tokens required.
  // If RoleWeight - this is minimum umber of votes.
  quorum: U128; // U128
  threshold: WeightOrRatio;
};

type RoleKind = 'Everyone' | { Member: Balance } | { Group: AccountId[] };

export function isMemberRole(r: RoleKind): r is { Member: Balance } {
  return typeof r === 'object' && typeof r['Member'] !== 'undefined';
}

export function isGroupRole(r: RoleKind): r is { Group: AccountId[] } {
  return typeof r === 'object' && typeof r['Group'] !== 'undefined';
}

type RolePermission = {
  name: string;
  kind: RoleKind;
  permissions: string[]; // e.g. [ *:AddProposal ]
  vote_policy: { [kind: string]: VotePolicy };
};

export type NearSputnikPolicy = {
  roles: RolePermission[];
  default_vote_policy: VotePolicy;
  proposal_bond: U128;
  proposal_period: Nanoseconds;
  bounty_bond: U128;
  bounty_forgiveness_period: Nanoseconds;
};

export function getUserRoles(
  policy: NearSputnikPolicy,
  user: AccountId
): string[] {
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

export function getTotalSupply(
  policy: NearSputnikPolicy,
  votePolicy: VotePolicy,
  tokenSupply: BN
): BN {
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
  method_name: string;
  args: Record<string, unknown>;
  deposit: U128;
  gas: string; // u64
};

// TODO: support other kinds?
type AddMemberToRole = {
  AddMemberToRole: { role: string; member_id: AccountId };
};
type RemoveMemberFromRole = {
  RemoveMemberFromRole: { role: string; member_id: AccountId };
};
type Transfer = {
  Transfer: {
    token_id: AccountId;
    amount: U128;
    receiver_id: AccountId;
    msg?: string;
  };
};
type FunctionCall = {
  FunctionCall: { actions: NearSputnikActionCall[]; receiver_id: AccountId };
};
type ChangePolicy = { ChangePolicy: { policy: NearSputnikPolicy } };
type ChangeConfig = { ChangeConfig: { config: NearSputnikConfig } };
export type NearSputnikProposalKind =
  | ChangeConfig
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

export function isAddMemberToRole(
  kind: NearSputnikProposalKind
): kind is AddMemberToRole {
  return (
    typeof kind === 'object' && typeof kind['AddMemberToRole'] === 'object'
  );
}

export function isRemoveMemberFromRole(
  kind: NearSputnikProposalKind
): kind is RemoveMemberFromRole {
  return (
    typeof kind === 'object' && typeof kind['RemoveMemberFromRole'] === 'object'
  );
}

export function isTransfer(kind: NearSputnikProposalKind): kind is Transfer {
  return typeof kind === 'object' && typeof kind['Transfer'] === 'object';
}

export function isFunctionCall(
  kind: NearSputnikProposalKind
): kind is FunctionCall {
  return typeof kind === 'object' && typeof kind['FunctionCall'] === 'object';
}

export function isChangePolicy(
  kind: NearSputnikProposalKind
): kind is ChangePolicy {
  return typeof kind === 'object' && typeof kind['ChangePolicy'] === 'object';
}

export function isChangeConfig(
  kind: NearSputnikProposalKind
): kind is ChangeConfig {
  return typeof kind === 'object' && typeof kind['ChangeConfig'] === 'object';
}

export function kindToPolicyLabel(kind: NearSputnikProposalKind): string {
  if (isChangeConfig(kind)) return 'config';
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

export function getVotePolicy(
  policy: NearSputnikPolicy,
  kind: NearSputnikProposalKind
): VotePolicy {
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
  id: number;
  description: string;
  // see https://github.com/near-daos/sputnik-dao-contract/blob/master/sputnikdao2/src/proposals.rs#L48
  kind: NearSputnikProposalKind;
  target?: unknown; // TODO: test what is this type...
  proposer: AccountId;
  status: NearSputnikProposalStatus;
  submission_time: Nanoseconds;
  // who will be e.g. "council" in the case of a class of voters
  vote_counts: { [who: string]: [number, number, number] }; // yes / no / remove = spam
  votes: { [who: string]: NearSputnikVoteString };
};

export type INearSputnikProposal = IIdentifiable &
  NearSputnikGetProposalResponse;

export class NearSputnikVote implements IVote<NearToken> {
  public readonly account: NearAccount;
  public readonly choice: NearSputnikVoteString;
  public readonly balance: BN;

  constructor(
    member: NearAccount,
    choice: NearSputnikVoteString,
    balance = new BN(1)
  ) {
    this.account = member;
    this.choice = choice;
    this.balance = balance;
  }
}
