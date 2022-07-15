import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { BaseUpgradeabilityProxy } from "../BaseUpgradeabilityProxy";
export declare class BaseUpgradeabilityProxy__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<BaseUpgradeabilityProxy>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): BaseUpgradeabilityProxy;
    connect(signer: Signer): BaseUpgradeabilityProxy__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): BaseUpgradeabilityProxy;
}
