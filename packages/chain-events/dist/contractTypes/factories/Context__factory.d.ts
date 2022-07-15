import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { Context } from "../Context";
export declare class Context__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): Context;
}
