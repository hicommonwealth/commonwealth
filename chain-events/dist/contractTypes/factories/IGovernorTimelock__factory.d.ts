import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IGovernorTimelock } from "../IGovernorTimelock";
export declare class IGovernorTimelock__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IGovernorTimelock;
}
