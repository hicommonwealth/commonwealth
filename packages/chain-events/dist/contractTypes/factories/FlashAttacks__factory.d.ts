import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { FlashAttacks } from "../FlashAttacks";
export declare class FlashAttacks__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(_token: string, _MINTER: string, _governance: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<FlashAttacks>;
    getDeployTransaction(_token: string, _MINTER: string, _governance: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): FlashAttacks;
    connect(signer: Signer): FlashAttacks__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): FlashAttacks;
}
