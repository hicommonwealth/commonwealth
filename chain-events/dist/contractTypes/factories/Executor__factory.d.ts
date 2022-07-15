import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Executor } from "../Executor";
export declare class Executor__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(admin: string, delay: BigNumberish, gracePeriod: BigNumberish, minimumDelay: BigNumberish, maximumDelay: BigNumberish, propositionThreshold: BigNumberish, voteDuration: BigNumberish, voteDifferential: BigNumberish, minimumQuorum: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<Executor>;
    getDeployTransaction(admin: string, delay: BigNumberish, gracePeriod: BigNumberish, minimumDelay: BigNumberish, maximumDelay: BigNumberish, propositionThreshold: BigNumberish, voteDuration: BigNumberish, voteDifferential: BigNumberish, minimumQuorum: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): Executor;
    connect(signer: Signer): Executor__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Executor;
}
