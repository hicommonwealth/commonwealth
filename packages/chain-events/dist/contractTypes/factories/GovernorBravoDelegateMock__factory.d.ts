import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GovernorBravoDelegateMock } from "../GovernorBravoDelegateMock";
export declare class GovernorBravoDelegateMock__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GovernorBravoDelegateMock>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GovernorBravoDelegateMock;
    connect(signer: Signer): GovernorBravoDelegateMock__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorBravoDelegateMock;
}
