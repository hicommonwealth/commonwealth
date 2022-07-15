import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IProjectBaseFactory } from "../IProjectBaseFactory";
export declare class IProjectBaseFactory__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IProjectBaseFactory;
}
