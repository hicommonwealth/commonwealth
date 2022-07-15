import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GovernorBravoEvents } from "../GovernorBravoEvents";
export declare class GovernorBravoEvents__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GovernorBravoEvents>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GovernorBravoEvents;
    connect(signer: Signer): GovernorBravoEvents__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorBravoEvents;
}
