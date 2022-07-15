import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ERC20VotesComp } from "../ERC20VotesComp";
export declare class ERC20VotesComp__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): ERC20VotesComp;
}
