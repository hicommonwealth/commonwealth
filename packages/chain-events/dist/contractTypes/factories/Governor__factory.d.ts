import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { Governor } from "../Governor";
export declare class Governor__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): Governor;
}
