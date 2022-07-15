import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Moloch1 } from "../Moloch1";
export declare class Moloch1__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(summoner: string, _approvedToken: string, _periodDuration: BigNumberish, _votingPeriodLength: BigNumberish, _gracePeriodLength: BigNumberish, _abortWindow: BigNumberish, _proposalDeposit: BigNumberish, _dilutionBound: BigNumberish, _processingReward: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<Moloch1>;
    getDeployTransaction(summoner: string, _approvedToken: string, _periodDuration: BigNumberish, _votingPeriodLength: BigNumberish, _gracePeriodLength: BigNumberish, _abortWindow: BigNumberish, _proposalDeposit: BigNumberish, _dilutionBound: BigNumberish, _processingReward: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): Moloch1;
    connect(signer: Signer): Moloch1__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Moloch1;
}
