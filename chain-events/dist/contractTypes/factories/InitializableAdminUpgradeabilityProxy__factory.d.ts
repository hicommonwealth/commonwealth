import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { InitializableAdminUpgradeabilityProxy } from "../InitializableAdminUpgradeabilityProxy";
export declare class InitializableAdminUpgradeabilityProxy__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<InitializableAdminUpgradeabilityProxy>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): InitializableAdminUpgradeabilityProxy;
    connect(signer: Signer): InitializableAdminUpgradeabilityProxy__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): InitializableAdminUpgradeabilityProxy;
}
