import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ERC20Permit } from "../ERC20Permit";
export declare class ERC20Permit__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): ERC20Permit;
}
