import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IGovernorCompatibilityBravo } from "../IGovernorCompatibilityBravo";
export declare class IGovernorCompatibilityBravo__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IGovernorCompatibilityBravo;
}
