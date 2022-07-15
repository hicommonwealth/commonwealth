import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { GovernorTimelockControl } from "../GovernorTimelockControl";
export declare class GovernorTimelockControl__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorTimelockControl;
}
