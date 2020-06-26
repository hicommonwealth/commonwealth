/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, Signer } from "ethers";
import { Provider } from "ethers/providers";

import { Context } from "./Context";

export class ContextFactory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Context {
    return new Contract(address, _abi, signerOrProvider) as Context;
  }
}

const _abi = [
  {
    inputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  }
];
