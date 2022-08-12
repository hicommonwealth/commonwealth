// TODO: figure out how to unify this with the query, so we don't need
//  to manually provide the types of each response. There are tools that
//  do this, but we'll need to think through them. Currently, this corresponds
//  exactly to the format returned by the graphql query.

// Represents all relevant fields of a member of a Moloch DAO
export interface IMolochMember {
  // address of the member
  id: string;

  // address of the member who invited them
  delegateKey: string;

  // number of shares owned by member
  shares: string;

  // highest proposal index on which the member voted YES
  highestIndexYesVote?: string;
}

export interface IMolochVote {
  // who voted
  memberAddress: string;

  // when did they vote
  timestamp: string;

  // 1 = yes, 2 = no, 0 = abstain
  uintVote: number;

  // n shares held by member
  member: IMolochMember;
}

// Every moloch proposal represents a request by an applicant to be added
// into the DAO. They offer tribute in ETH and request shares, which are minted
// upon success (diluting the value of all shareholders). In this way, applicants
// can be either people who want to participate, or projects requesting funding,
// where the "applicant" acts as escrow and offers no tribute.
export interface IMolochProposalResponse {
  // dummy field required by interfaces
  identifier: string;

  // unique identifier
  id: string;

  // name of applicant/application project or ipfs hash
  details: string;

  // time of submission
  timestamp: string;

  // periodDuration: default = 17280 = 4.8 hours in seconds (5 periods per day)
  // votingPeriodLength: default = 35 periods (7 days)
  // currentPeriod = (now - summoning time) / periodDuration
  // absolute period when it starts, given above
  startingPeriod: string;

  // sponsoring address
  delegateKey: string;

  // address of applicant
  applicantAddress: string;

  // how much ETH applicant is offering as tribute
  tokenTribute: string;

  // how many shares applicant is requesting upon joining
  sharesRequested: string;

  // was it completed?
  processed: boolean;

  // proposal state
  status?: string;
  didPass?: boolean;
  aborted?: boolean;

  // list of all votes
  votes: IMolochVote[];

  // used if votes cannot be fetched
  yesVotes?: string;
  noVotes?: string;
}
