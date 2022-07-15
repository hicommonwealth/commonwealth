import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { AccessControl } from "../AccessControl";
export declare class AccessControl__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): AccessControl;
}
