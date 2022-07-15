import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GovernorBravoDelegate } from "../GovernorBravoDelegate";
export declare class GovernorBravoDelegate__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GovernorBravoDelegate>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GovernorBravoDelegate;
    connect(signer: Signer): GovernorBravoDelegate__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorBravoDelegate;
}
