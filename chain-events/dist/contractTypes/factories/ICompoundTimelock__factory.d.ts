import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ICompoundTimelock } from "../ICompoundTimelock";
export declare class ICompoundTimelock__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): ICompoundTimelock;
}
