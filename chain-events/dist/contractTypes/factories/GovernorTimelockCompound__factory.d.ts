import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { GovernorTimelockCompound } from "../GovernorTimelockCompound";
export declare class GovernorTimelockCompound__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorTimelockCompound;
}
