export interface IGovernor {
  readonly contractAddress: string;

  createArbitraryProposal: (
    accountIndex: number,
    advanceDays?: number | string
  ) => Promise<any>;

  queueProposal: (
    proposalId: string | number,
    advanceTime?: boolean
  ) => Promise<any>;

  cancelProposal(proposalId: string | number): Promise<any>;

  castVote(
    proposalId: string | number,
    accountIndex: number,
    forAgainst: boolean
  ): Promise<any>;

  getProposalDetails(proposalId: number | string): Promise<any>;

  executeProposal(
    proposalId: string | number,
    advanceTime?: boolean
  ): Promise<any>;

  getVotes(accountIndex: number, numberOfVotes: string): Promise<any>;

  endToEndSim(): Promise<void>;
}
