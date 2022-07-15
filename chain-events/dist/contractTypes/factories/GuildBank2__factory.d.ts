import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GuildBank2 } from "../GuildBank2";
export declare class GuildBank2__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GuildBank2>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GuildBank2;
    connect(signer: Signer): GuildBank2__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GuildBank2;
}
