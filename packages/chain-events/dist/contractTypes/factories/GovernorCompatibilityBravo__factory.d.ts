import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { GovernorCompatibilityBravo } from "../GovernorCompatibilityBravo";
export declare class GovernorCompatibilityBravo__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorCompatibilityBravo;
}
