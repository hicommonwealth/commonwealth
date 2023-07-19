import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ECDSAKernelFactory, ECDSAKernelFactoryInterface } from "../ECDSAKernelFactory";
export declare class ECDSAKernelFactory__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "contract KernelFactory";
            readonly name: "_singletonFactory";
            readonly type: "address";
        }, {
            readonly internalType: "contract ECDSAValidator";
            readonly name: "_validator";
            readonly type: "address";
        }, {
            readonly internalType: "contract IEntryPoint";
            readonly name: "_entryPoint";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "_owner";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "_index";
            readonly type: "uint256";
        }];
        readonly name: "createAccount";
        readonly outputs: readonly [{
            readonly internalType: "contract EIP1967Proxy";
            readonly name: "proxy";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "entryPoint";
        readonly outputs: readonly [{
            readonly internalType: "contract IEntryPoint";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "_owner";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "_index";
            readonly type: "uint256";
        }];
        readonly name: "getAccountAddress";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "singletonFactory";
        readonly outputs: readonly [{
            readonly internalType: "contract KernelFactory";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "validator";
        readonly outputs: readonly [{
            readonly internalType: "contract ECDSAValidator";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): ECDSAKernelFactoryInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ECDSAKernelFactory;
}
