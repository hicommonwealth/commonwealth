import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { Multisend, MultisendInterface } from "../Multisend";
export declare class Multisend__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes";
            readonly name: "transactions";
            readonly type: "bytes";
        }];
        readonly name: "multiSend";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }];
    static createInterface(): MultisendInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): Multisend;
}
