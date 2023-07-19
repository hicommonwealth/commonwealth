import { ethers } from "ethers";
import { UserOperationBuilder } from "../../builder";
import { Kernel as KernelImpl } from "../../typechain";
import { IPresetBuilderOpts, ICall } from "../../types";
export declare class Kernel extends UserOperationBuilder {
    private signer;
    private provider;
    private entryPoint;
    private factory;
    private initCode;
    private multisend;
    proxy: KernelImpl;
    private constructor();
    private resolveAccount;
    private sudoMode;
    static init(signer: ethers.Signer, rpcUrl: string, opts?: IPresetBuilderOpts): Promise<Kernel>;
    execute(call: ICall): this;
    executeBatch(calls: Array<ICall>): this;
}
