import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { GovernorVotesQuorumFraction } from "../GovernorVotesQuorumFraction";
export declare class GovernorVotesQuorumFraction__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorVotesQuorumFraction;
}
