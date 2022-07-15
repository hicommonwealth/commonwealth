import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ExecutorWithTimelock } from "../ExecutorWithTimelock";
export declare class ExecutorWithTimelock__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(admin: string, delay: BigNumberish, gracePeriod: BigNumberish, minimumDelay: BigNumberish, maximumDelay: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ExecutorWithTimelock>;
    getDeployTransaction(admin: string, delay: BigNumberish, gracePeriod: BigNumberish, minimumDelay: BigNumberish, maximumDelay: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): ExecutorWithTimelock;
    connect(signer: Signer): ExecutorWithTimelock__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): ExecutorWithTimelock;
}
