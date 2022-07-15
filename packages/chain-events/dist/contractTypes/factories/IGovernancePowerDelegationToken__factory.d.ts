import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IGovernancePowerDelegationToken } from "../IGovernancePowerDelegationToken";
export declare class IGovernancePowerDelegationToken__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): IGovernancePowerDelegationToken;
}
