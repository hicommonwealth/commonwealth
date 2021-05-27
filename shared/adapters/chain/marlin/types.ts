// TODO: figure out how to unify this with the query, so we don't need
//  to manually provide the types of each response. There are tools that
//  do this, but we'll need to think through them. Currently, this corresponds
//  exactly to the format returned by the graphql query.

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

  startBlock: number;
  endBlock: number;
  eta: number; // The timestamp that the proposal will be available for execution, set once the vote succeeds

  forVotes: number;
  againstVotes: number;

  canceled: boolean;
  executed: boolean;

  // TODO: State
}
