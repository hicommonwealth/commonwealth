import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { GovernorProposalThreshold } from "../GovernorProposalThreshold";
export declare class GovernorProposalThreshold__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorProposalThreshold;
}
