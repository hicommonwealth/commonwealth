export interface IGovernor {
    readonly contractAddress: string;
    createArbitraryProposal: () => Promise<string>;
}