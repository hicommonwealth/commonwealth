import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { GovernorVotes } from "../GovernorVotes";
export declare class GovernorVotes__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorVotes;
}
