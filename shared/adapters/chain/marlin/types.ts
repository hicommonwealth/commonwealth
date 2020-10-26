// TODO: figure out how to unify this with the query, so we don't need
//  to manually provide the types of each response. There are tools that
//  do this, but we'll need to think through them. Currently, this corresponds
//  exactly to the format returned by the graphql query.

// Represents all relevant fields of a member of a Moloch DAO
export interface IMarlinMember {
  // address of the member
  id: string;

  // address of the member who invited them
  delegateKey: string;

  // number of shares owned by member
  shares: string;

  // highest proposal index on which the member voted YES
  highestIndexYesVote?: string;
}

export interface IMarlinVote {
  // who voted
  delegateAddress: string;

  // when did they vote
  timestamp: string;

  // number of votes
  voteWeight: number;

  // 1 = yes, 2 = no, 0 = abstain
  uintVote: number;

  member: IMarlinMember;
}

export interface IMarlinProposalResponse {
  // dummy field required by interfaces
  identifier: string;

  // unique identifier
  id: string;

  // time of submission
  timestamp: string;

  startingPeriod: string;

  // sponsoring address
  delegateVotes: string;

  // TODO: proposal state


  // list of all votes
  votes: IMarlinVote[];

  // used if votes cannot be fetched
  yesVotes?: string;
  noVotes?: string;
}
