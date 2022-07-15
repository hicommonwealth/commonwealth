import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GovernorMock } from "../GovernorMock";
export declare class GovernorMock__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(name_: string, token_: string, votingDelay_: BigNumberish, votingPeriod_: BigNumberish, timelock_: string, quorumNumerator_: BigNumberish, proposalThreshold_: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GovernorMock>;
    getDeployTransaction(name_: string, token_: string, votingDelay_: BigNumberish, votingPeriod_: BigNumberish, timelock_: string, quorumNumerator_: BigNumberish, proposalThreshold_: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GovernorMock;
    connect(signer: Signer): GovernorMock__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorMock;
}
