import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { AaveTokenV2Mock } from "../AaveTokenV2Mock";
export declare class AaveTokenV2Mock__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<AaveTokenV2Mock>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): AaveTokenV2Mock;
    connect(signer: Signer): AaveTokenV2Mock__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): AaveTokenV2Mock;
}
