import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { SelfdestructTransfer } from "../SelfdestructTransfer";
export declare class SelfdestructTransfer__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<SelfdestructTransfer>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): SelfdestructTransfer;
    connect(signer: Signer): SelfdestructTransfer__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): SelfdestructTransfer;
}
