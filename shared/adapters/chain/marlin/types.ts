// TODO: figure out how to unify this with the query, so we don't need
//  to manually provide the types of each response. There are tools that
//  do this, but we'll need to think through them. Currently, this corresponds
//  exactly to the format returned by the graphql query.

// Represents all relevant fields of a member of a Moloch DAO
export interface IMarlinHolder {
  // address of the member
  id: string;

  // balance
  balance: string;

  // delegates
  delegates: string;
}

export interface IMarlinVote {
  // TODO: FILL THIS OUT!!!!
  // who voted
  delegateAddress: string;

  // when did they vote
  timestamp: string;

  // number of votes
  voteWeight: number;

  // 1 = yes, 2 = no, 0 = abstain
  uintVote: number;

  delegate: IMarlinHolder;
}

export interface IMarlinProposalResponse {
  // dummy field required by interfaces
  identifier: string;

  // unique identifier
  id: string;

  proposer: string; // author
  description: string;

  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];

  startBlock: number; // TODO: BN?
  endBlock: number;
  eta: number; // The timestamp that the proposal will be available for execution, set once the vote succeeds

  forVotes: number;
  againstVotes: number;

  canceled: boolean;
  exectued: boolean;

  // TODO: State
}
