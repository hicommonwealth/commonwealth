import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GovernanceStrategy } from "../GovernanceStrategy";
export declare class GovernanceStrategy__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(aave: string, stkAave: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GovernanceStrategy>;
    getDeployTransaction(aave: string, stkAave: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GovernanceStrategy;
    connect(signer: Signer): GovernanceStrategy__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernanceStrategy;
}
