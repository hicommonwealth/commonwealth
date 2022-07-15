import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { AaveTokenV1Mock } from "../AaveTokenV1Mock";
export declare class AaveTokenV1Mock__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<AaveTokenV1Mock>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): AaveTokenV1Mock;
    connect(signer: Signer): AaveTokenV1Mock__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): AaveTokenV1Mock;
}
