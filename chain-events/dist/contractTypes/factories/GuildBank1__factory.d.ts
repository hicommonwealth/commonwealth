import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GuildBank1 } from "../GuildBank1";
export declare class GuildBank1__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(approvedTokenAddress: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GuildBank1>;
    getDeployTransaction(approvedTokenAddress: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GuildBank1;
    connect(signer: Signer): GuildBank1__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GuildBank1;
}
