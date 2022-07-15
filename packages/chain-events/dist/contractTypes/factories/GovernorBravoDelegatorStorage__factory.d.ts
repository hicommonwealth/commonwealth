import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GovernorBravoDelegatorStorage } from "../GovernorBravoDelegatorStorage";
export declare class GovernorBravoDelegatorStorage__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GovernorBravoDelegatorStorage>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GovernorBravoDelegatorStorage;
    connect(signer: Signer): GovernorBravoDelegatorStorage__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorBravoDelegatorStorage;
}
