import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC777 } from "../IERC777";
export declare class IERC777__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IERC777;
}
