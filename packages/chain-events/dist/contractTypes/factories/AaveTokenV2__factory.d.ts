import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { AaveTokenV2 } from "../AaveTokenV2";
export declare class AaveTokenV2__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<AaveTokenV2>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): AaveTokenV2;
    connect(signer: Signer): AaveTokenV2__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): AaveTokenV2;
}
