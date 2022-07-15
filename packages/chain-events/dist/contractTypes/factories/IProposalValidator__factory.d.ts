import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IProposalValidator } from "../IProposalValidator";
export declare class IProposalValidator__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IProposalValidator;
}
