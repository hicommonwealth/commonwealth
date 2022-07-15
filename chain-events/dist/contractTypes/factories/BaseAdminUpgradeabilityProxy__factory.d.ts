import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { BaseAdminUpgradeabilityProxy } from "../BaseAdminUpgradeabilityProxy";
export declare class BaseAdminUpgradeabilityProxy__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<BaseAdminUpgradeabilityProxy>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): BaseAdminUpgradeabilityProxy;
    connect(signer: Signer): BaseAdminUpgradeabilityProxy__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): BaseAdminUpgradeabilityProxy;
}
