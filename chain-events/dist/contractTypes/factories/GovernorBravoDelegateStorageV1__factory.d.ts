import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GovernorBravoDelegateStorageV1 } from "../GovernorBravoDelegateStorageV1";
export declare class GovernorBravoDelegateStorageV1__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GovernorBravoDelegateStorageV1>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GovernorBravoDelegateStorageV1;
    connect(signer: Signer): GovernorBravoDelegateStorageV1__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorBravoDelegateStorageV1;
}
