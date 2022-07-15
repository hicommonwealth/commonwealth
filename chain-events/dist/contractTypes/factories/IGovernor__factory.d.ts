import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IGovernor } from "../IGovernor";
export declare class IGovernor__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IGovernor;
}
