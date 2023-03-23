export interface IGovernor {
  readonly contractAddress: string;

  createArbitraryProposal: (
    accountIndex: number,
    advanceDays?: number | string
  ) => Promise<string>;

  queueProposal: (
    proposalId: string | number,
    advanceTime?: boolean
  ) => Promise<void>;
  cancelProposal(proposalId: string | number): Promise<void>;

  castVote(
    proposalId: string | number,
    accountIndex: number,
    forAgainst: boolean
  ): Promise<void>;

  getProposalDetails(proposalId: number | string): Promise<any>;

  executeProposal(
    proposalId: string | number,
    advanceTime?: boolean
  ): Promise<void>;

  getVotes(accountIndex: number, numberOfVotes: string): Promise<void>;

  endToEndSim(): Promise<void>;
}
