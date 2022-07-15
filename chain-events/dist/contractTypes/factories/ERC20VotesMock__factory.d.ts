import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ERC20VotesMock } from "../ERC20VotesMock";
export declare class ERC20VotesMock__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(name: string, symbol: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ERC20VotesMock>;
    getDeployTransaction(name: string, symbol: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): ERC20VotesMock;
    connect(signer: Signer): ERC20VotesMock__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): ERC20VotesMock;
}
