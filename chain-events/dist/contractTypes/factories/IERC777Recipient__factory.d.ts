import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC777Recipient } from "../IERC777Recipient";
export declare class IERC777Recipient__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IERC777Recipient;
}
