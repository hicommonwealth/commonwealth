import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { GovernorVotesComp } from "../GovernorVotesComp";
export declare class GovernorVotesComp__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorVotesComp;
}
