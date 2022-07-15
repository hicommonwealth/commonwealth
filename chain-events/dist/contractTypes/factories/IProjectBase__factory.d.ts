import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IProjectBase } from "../IProjectBase";
export declare class IProjectBase__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IProjectBase;
}
