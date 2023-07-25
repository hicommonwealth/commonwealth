import { ethers } from "ethers";
import { UserOperationMiddlewareFn } from "../../types";
export declare const EOASignature: (signer: ethers.Signer) => UserOperationMiddlewareFn;
