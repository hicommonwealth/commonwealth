import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IExecutorWithTimelock } from "../IExecutorWithTimelock";
export declare class IExecutorWithTimelock__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IExecutorWithTimelock;
}
