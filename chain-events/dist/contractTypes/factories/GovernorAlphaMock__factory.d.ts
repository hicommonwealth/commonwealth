import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { GovernorAlphaMock } from "../GovernorAlphaMock";
export declare class GovernorAlphaMock__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(timelock_: string, MPond_: string, guardian_: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<GovernorAlphaMock>;
    getDeployTransaction(timelock_: string, MPond_: string, guardian_: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): GovernorAlphaMock;
    connect(signer: Signer): GovernorAlphaMock__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): GovernorAlphaMock;
}
