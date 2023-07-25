import { ethers } from "ethers";
import { UserOperationMiddlewareFn } from "../../types";
export declare const getGasPrice: (provider: ethers.providers.JsonRpcProvider) => UserOperationMiddlewareFn;
