import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { MPond } from "../MPond";
export declare class MPond__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(account: string, bridge: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<MPond>;
    getDeployTransaction(account: string, bridge: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): MPond;
    connect(signer: Signer): MPond__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): MPond;
}
