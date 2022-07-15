import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { FeiDAO } from "../FeiDAO";
export declare class FeiDAO__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(tribe: string, timelock: string, guardian: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<FeiDAO>;
    getDeployTransaction(tribe: string, timelock: string, guardian: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): FeiDAO;
    connect(signer: Signer): FeiDAO__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): FeiDAO;
}
