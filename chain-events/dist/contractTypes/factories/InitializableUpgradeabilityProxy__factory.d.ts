import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { InitializableUpgradeabilityProxy } from "../InitializableUpgradeabilityProxy";
export declare class InitializableUpgradeabilityProxy__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<InitializableUpgradeabilityProxy>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): InitializableUpgradeabilityProxy;
    connect(signer: Signer): InitializableUpgradeabilityProxy__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): InitializableUpgradeabilityProxy;
}
