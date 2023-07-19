import { BigNumberish, BytesLike, ethers } from "ethers";
import { UserOperationBuilder } from "../../builder";
import { SimpleAccount as SimpleAccountImpl } from "../../typechain";
import { IPresetBuilderOpts } from "../../types";
export declare class SimpleAccount extends UserOperationBuilder {
    private signer;
    private provider;
    private entryPoint;
    private factory;
    private initCode;
    proxy: SimpleAccountImpl;
    private constructor();
    private resolveAccount;
    static init(signer: ethers.Signer, rpcUrl: string, opts?: IPresetBuilderOpts): Promise<SimpleAccount>;
    execute(to: string, value: BigNumberish, data: BytesLike): this;
    executeBatch(to: Array<string>, data: Array<BytesLike>): this;
}
