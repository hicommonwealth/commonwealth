import { Signer } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { KernelFactory, KernelFactoryInterface } from "../KernelFactory";
export declare class KernelFactory__factory {
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "contract IEntryPoint";
            readonly name: "_entryPoint";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "account";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "validator";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "index";
            readonly type: "uint256";
        }];
        readonly name: "AccountCreated";
        readonly type: "event";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "contract IKernelValidator";
            readonly name: "_validator";
            readonly type: "address";
        }, {
            readonly internalType: "bytes";
            readonly name: "_data";
            readonly type: "bytes";
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
            readonly internalType: "contract IKernelValidator";
            readonly name: "_validator";
            readonly type: "address";
        }, {
            readonly internalType: "bytes";
            readonly name: "_data";
            readonly type: "bytes";
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
        readonly name: "kernelTemplate";
        readonly outputs: readonly [{
            readonly internalType: "contract TempKernel";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "nextTemplate";
        readonly outputs: readonly [{
            readonly internalType: "contract Kernel";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): KernelFactoryInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): KernelFactory;
}
