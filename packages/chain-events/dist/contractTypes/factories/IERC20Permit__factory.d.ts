import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC20Permit } from "../IERC20Permit";
export declare class IERC20Permit__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IERC20Permit;
}
