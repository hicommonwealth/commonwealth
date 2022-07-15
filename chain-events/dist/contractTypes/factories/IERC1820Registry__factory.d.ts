import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC1820Registry } from "../IERC1820Registry";
export declare class IERC1820Registry__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IERC1820Registry;
}
