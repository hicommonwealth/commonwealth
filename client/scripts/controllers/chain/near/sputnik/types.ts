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

type VotePolicy = {
  weight_kind: string, // TODO
  quorum: string, // U128
  threshold: object, // TODO
};

type RolePermission = {
  name: string,
  kind: string,
  permissions: string[],
  vote_policy: { [kind: string]: VotePolicy },
};

export type NearSputnikPolicy = {
  roles: RolePermission[],
  default_vote_policy: VotePolicy,
  proposal_bond: string, // U128
  proposal_period: string, // nanoseconds
  bounty_bond: string, // U128
  bounty_forgiveness_period: string, // nanoseconds
};

type NearSputnikActionCall = { method_name: string, args: any, deposit: string, gas: string };

// TODO: support other kinds?
type AddMemberToRole = { AddMemberToRole: { role: string, member_id: string } };
type RemoveMemberFromRole = { RemoveMemberFromRole : { role: string, member_id: string } };
type Transfer = { Transfer: { token_id: string, amount: string, receiver_id: string, msg?: string } };
type FunctionCall = { FunctionCall: { actions: NearSputnikActionCall[], received_id: string } };
type NearSputnikProposalKind = 'ChangeConfig'
  | 'ChangePolicy'
  | 'UpgradeSelf'
  | 'UpgradeRemote'
  | 'Transfer'
  | 'SetStakingContract'
  | 'AddBounty'
  | 'BountyDone'
  | 'Vote'
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

// proposal type returned by get_proposals query
export type NearSputnikGetProposalResponse = {
  id: number,
  description: string,
  // see https://github.com/near-daos/sputnik-dao-contract/blob/master/sputnikdao2/src/proposals.rs#L48
  kind: NearSputnikProposalKind,
  target?: string, // TODO: test
  proposer: string, // AccoundId
  status: NearSputnikProposalStatus,
  submission_time: string, // nanoseconds
  // who will be e.g. "council" in the case of a class of voters
  vote_counts: { [who: string]: [ number, number, number ] }, // yes / no / remove = spam
  votes: { [who: string]: NearSputnikVoteString, },
};

export type INearSputnikProposal = IIdentifiable & NearSputnikGetProposalResponse;

export class NearSputnikVote implements IVote<NearToken> {
  public readonly account: NearAccount;
  public readonly choice: NearSputnikVoteString;

  constructor(member: NearAccount, choice: NearSputnikVoteString) {
    this.account = member;
    this.choice = choice;
  }
}
