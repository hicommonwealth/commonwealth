import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { TimelockInterface } from "../TimelockInterface";
export declare class TimelockInterface__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): TimelockInterface;
}
