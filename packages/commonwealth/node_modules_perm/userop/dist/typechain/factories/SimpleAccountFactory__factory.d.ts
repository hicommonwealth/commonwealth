import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { SimpleAccountFactory, SimpleAccountFactoryInterface } from "../SimpleAccountFactory";
export declare class SimpleAccountFactory__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "contract IEntryPoint";
            readonly name: "_entryPoint";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly inputs: readonly [];
        readonly name: "accountImplementation";
        readonly outputs: readonly [{
            readonly internalType: "contract SimpleAccount";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "salt";
            readonly type: "uint256";
        }];
        readonly name: "createAccount";
        readonly outputs: readonly [{
            readonly internalType: "contract SimpleAccount";
            readonly name: "ret";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "salt";
            readonly type: "uint256";
        }];
        readonly name: "getAddress";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): SimpleAccountFactoryInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): SimpleAccountFactory;
}
