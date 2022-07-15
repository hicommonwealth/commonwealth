import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GovernorBravoDelegator } from "../GovernorBravoDelegator";
export declare class GovernorBravoDelegator__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(timelock_: string, comp_: string, admin_: string, implementation_: string, votingPeriod_: BigNumberish, votingDelay_: BigNumberish, proposalThreshold_: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GovernorBravoDelegator>;
    getDeployTransaction(timelock_: string, comp_: string, admin_: string, implementation_: string, votingPeriod_: BigNumberish, votingDelay_: BigNumberish, proposalThreshold_: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GovernorBravoDelegator;
    connect(signer: Signer): GovernorBravoDelegator__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorBravoDelegator;
}
