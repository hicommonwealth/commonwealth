import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC20Metadata } from "../IERC20Metadata";
export declare class IERC20Metadata__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IERC20Metadata;
}
