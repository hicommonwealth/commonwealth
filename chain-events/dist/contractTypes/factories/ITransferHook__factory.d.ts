import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ITransferHook } from "../ITransferHook";
export declare class ITransferHook__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): ITransferHook;
}
