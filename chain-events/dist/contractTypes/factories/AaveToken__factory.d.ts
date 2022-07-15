import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { AaveToken } from "../AaveToken";
export declare class AaveToken__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<AaveToken>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): AaveToken;
    connect(signer: Signer): AaveToken__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): AaveToken;
}
