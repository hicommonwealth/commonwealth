import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { AaveGovernanceV2 } from "../AaveGovernanceV2";
export declare class AaveGovernanceV2__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(governanceStrategy: string, votingDelay: BigNumberish, guardian: string, executors: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<AaveGovernanceV2>;
    getDeployTransaction(governanceStrategy: string, votingDelay: BigNumberish, guardian: string, executors: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): AaveGovernanceV2;
    connect(signer: Signer): AaveGovernanceV2__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): AaveGovernanceV2;
}
