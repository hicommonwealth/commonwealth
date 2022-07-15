import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { ICuratedProject } from "../ICuratedProject";
export declare class ICuratedProject__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): ICuratedProject;
}
