import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { TimelockController } from "../TimelockController";
export declare class TimelockController__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(minDelay: BigNumberish, proposers: string[], executors: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<TimelockController>;
    getDeployTransaction(minDelay: BigNumberish, proposers: string[], executors: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): TimelockController;
    connect(signer: Signer): TimelockController__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): TimelockController;
}
