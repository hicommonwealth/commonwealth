import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { GovernancePowerDelegationERC20 } from "../GovernancePowerDelegationERC20";
export declare class GovernancePowerDelegationERC20__factory {
    static connect(address: string, signerOrProvider: Signer | Provider): GovernancePowerDelegationERC20;
}
