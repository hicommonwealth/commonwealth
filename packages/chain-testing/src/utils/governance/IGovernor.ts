export interface IGovernor {
    readonly contractAddress: string;
    createArbitraryProposal: () => Promise<string>;
    queueProposal: (proposalId: string | number, advanceTime?: boolean) => Promise<void>;
}