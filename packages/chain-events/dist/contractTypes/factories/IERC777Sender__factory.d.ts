import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC777Sender } from "../IERC777Sender";
export declare class IERC777Sender__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IERC777Sender;
}
