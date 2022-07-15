import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GovernorBravoImmutable } from "../GovernorBravoImmutable";
export declare class GovernorBravoImmutable__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(timelock_: string, comp_: string, admin_: string, votingPeriod_: BigNumberish, votingDelay_: BigNumberish, proposalThreshold_: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GovernorBravoImmutable>;
    getDeployTransaction(timelock_: string, comp_: string, admin_: string, votingPeriod_: BigNumberish, votingDelay_: BigNumberish, proposalThreshold_: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GovernorBravoImmutable;
    connect(signer: Signer): GovernorBravoImmutable__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorBravoImmutable;
}
