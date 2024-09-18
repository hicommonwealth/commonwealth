export interface IGovernor {
  readonly contractAddress: string;

  createArbitraryProposal: (
    accountIndex: number,
    advanceDays?: number | string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<any>;

  queueProposal: (
    proposalId: string | number,
    advanceTime?: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cancelProposal(proposalId: string | number): Promise<any>;

  castVote(
    proposalId: string | number,
    accountIndex: number,
    forAgainst: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProposalDetails(proposalId: number | string): Promise<any>;

  executeProposal(
    proposalId: string | number,
    advanceTime?: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getVotes(accountIndex: number, numberOfVotes: string): Promise<any>;

  endToEndSim(): Promise<void>;
}
