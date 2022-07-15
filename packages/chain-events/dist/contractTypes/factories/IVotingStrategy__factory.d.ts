import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IVotingStrategy } from "../IVotingStrategy";
export declare class IVotingStrategy__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IVotingStrategy;
}
