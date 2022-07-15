import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ICuratedProjectFactory } from "../ICuratedProjectFactory";
export declare class ICuratedProjectFactory__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): ICuratedProjectFactory;
}
