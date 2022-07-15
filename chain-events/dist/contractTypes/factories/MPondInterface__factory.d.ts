import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { MPondInterface } from "../MPondInterface";
export declare class MPondInterface__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): MPondInterface;
}
