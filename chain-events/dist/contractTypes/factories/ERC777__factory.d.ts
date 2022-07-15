import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ERC777 } from "../ERC777";
export declare class ERC777__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(name: string, symbol: string, defaultOperators: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ERC777>;
    getDeployTransaction(name: string, symbol: string, defaultOperators: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): ERC777;
    connect(signer: Signer): ERC777__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): ERC777;
}
