import { Signer, BigNumberish, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Token } from "../Token";
export declare class Token__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(supply: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<Token>;
    getDeployTransaction(supply: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): Token;
    connect(signer: Signer): Token__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Token;
}
