import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ProposalValidator } from "../ProposalValidator";
export declare class ProposalValidator__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(propositionThreshold: BigNumberish, votingDuration: BigNumberish, voteDifferential: BigNumberish, minimumQuorum: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ProposalValidator>;
    getDeployTransaction(propositionThreshold: BigNumberish, votingDuration: BigNumberish, voteDifferential: BigNumberish, minimumQuorum: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): ProposalValidator;
    connect(signer: Signer): ProposalValidator__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): ProposalValidator;
}
