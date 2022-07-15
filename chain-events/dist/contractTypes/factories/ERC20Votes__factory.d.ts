import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ERC20Votes } from "../ERC20Votes";
export declare class ERC20Votes__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): ERC20Votes;
}
