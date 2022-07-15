import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Moloch2 } from "../Moloch2";
export declare class Moloch2__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(summoner: string, _approvedTokens: string[], _periodDuration: BigNumberish, _votingPeriodLength: BigNumberish, _gracePeriodLength: BigNumberish, _emergencyExitWait: BigNumberish, _proposalDeposit: BigNumberish, _dilutionBound: BigNumberish, _processingReward: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<Moloch2>;
    getDeployTransaction(summoner: string, _approvedTokens: string[], _periodDuration: BigNumberish, _votingPeriodLength: BigNumberish, _gracePeriodLength: BigNumberish, _emergencyExitWait: BigNumberish, _proposalDeposit: BigNumberish, _dilutionBound: BigNumberish, _processingReward: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): Moloch2;
    connect(signer: Signer): Moloch2__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Moloch2;
}
