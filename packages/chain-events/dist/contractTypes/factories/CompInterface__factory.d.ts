import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { CompInterface } from "../CompInterface";
export declare class CompInterface__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): CompInterface;
}
