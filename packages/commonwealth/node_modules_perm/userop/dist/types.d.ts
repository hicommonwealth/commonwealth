import { BigNumberish, BytesLike } from "ethers";
import { UserOperationEventEvent } from "./typechain/EntryPoint";
export interface IUserOperation {
    sender: string;
    nonce: BigNumberish;
    initCode: BytesLike;
    callData: BytesLike;
    callGasLimit: BigNumberish;
    verificationGasLimit: BigNumberish;
    preVerificationGas: BigNumberish;
    maxFeePerGas: BigNumberish;
    maxPriorityFeePerGas: BigNumberish;
    paymasterAndData: BytesLike;
    signature: BytesLike;
}
export interface IUserOperationBuilder {
    getSender: () => string;
    getNonce: () => BigNumberish;
    getInitCode: () => BytesLike;
    getCallData: () => BytesLike;
    getCallGasLimit: () => BigNumberish;
    getVerificationGasLimit: () => BigNumberish;
    getPreVerificationGas: () => BigNumberish;
    getMaxFeePerGas: () => BigNumberish;
    getMaxPriorityFeePerGas: () => BigNumberish;
    getPaymasterAndData: () => BytesLike;
    getSignature: () => BytesLike;
    getOp: () => IUserOperation;
    setSender: (address: string) => IUserOperationBuilder;
    setNonce: (nonce: BigNumberish) => IUserOperationBuilder;
    setInitCode: (code: BytesLike) => IUserOperationBuilder;
    setCallData: (data: BytesLike) => IUserOperationBuilder;
    setCallGasLimit: (gas: BigNumberish) => IUserOperationBuilder;
    setVerificationGasLimit: (gas: BigNumberish) => IUserOperationBuilder;
    setPreVerificationGas: (gas: BigNumberish) => IUserOperationBuilder;
    setMaxFeePerGas: (fee: BigNumberish) => IUserOperationBuilder;
    setMaxPriorityFeePerGas: (fee: BigNumberish) => IUserOperationBuilder;
    setPaymasterAndData: (data: BytesLike) => IUserOperationBuilder;
    setSignature: (bytes: BytesLike) => IUserOperationBuilder;
    setPartial: (partialOp: Partial<IUserOperation>) => IUserOperationBuilder;
    useDefaults: (partialOp: Partial<IUserOperation>) => IUserOperationBuilder;
    resetDefaults: () => IUserOperationBuilder;
    useMiddleware: (fn: UserOperationMiddlewareFn) => IUserOperationBuilder;
    resetMiddleware: () => IUserOperationBuilder;
    buildOp: (entryPoint: string, chainId: BigNumberish) => Promise<IUserOperation>;
    resetOp: () => IUserOperationBuilder;
}
export type UserOperationMiddlewareFn = (context: IUserOperationMiddlewareCtx) => Promise<void>;
export interface IUserOperationMiddlewareCtx {
    op: IUserOperation;
    entryPoint: string;
    chainId: BigNumberish;
    getUserOpHash: () => string;
}
export interface IClient {
    sendUserOperation: (builder: IUserOperationBuilder, opts?: ISendUserOperationOpts) => Promise<ISendUserOperationResponse>;
    buildUserOperation: (builder: IUserOperationBuilder) => Promise<IUserOperation>;
}
export interface IClientOpts {
    entryPoint?: string;
    overrideBundlerRpc?: string;
}
export interface ISendUserOperationOpts {
    dryRun?: boolean;
    onBuild?: (op: IUserOperation) => Promise<any> | any;
}
export interface ISendUserOperationResponse {
    userOpHash: string;
    wait: () => Promise<UserOperationEventEvent | null>;
}
export interface IPresetBuilderOpts {
    entryPoint?: string;
    factory?: string;
    paymasterMiddleware?: UserOperationMiddlewareFn;
    overrideBundlerRpc?: string;
}
export interface ICall {
    to: string;
    value: BigNumberish;
    data: BytesLike;
}
