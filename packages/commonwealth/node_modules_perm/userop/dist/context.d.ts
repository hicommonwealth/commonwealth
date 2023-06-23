import { BigNumberish } from "ethers";
import { IUserOperationMiddlewareCtx, IUserOperation } from "./types";
export declare class UserOperationMiddlewareCtx implements IUserOperationMiddlewareCtx {
    op: IUserOperation;
    readonly entryPoint: string;
    readonly chainId: BigNumberish;
    constructor(op: IUserOperation, entryPoint: string, chainId: BigNumberish);
    getUserOpHash(): string;
}
