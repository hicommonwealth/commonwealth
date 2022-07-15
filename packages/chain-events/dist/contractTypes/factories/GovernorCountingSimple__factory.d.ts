import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { GovernorCountingSimple } from "../GovernorCountingSimple";
export declare class GovernorCountingSimple__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorCountingSimple;
}
