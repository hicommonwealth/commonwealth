/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { CompInterface } from "../CompInterface";

export class CompInterface__factory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CompInterface {
    return new Contract(address, _abi, signerOrProvider) as CompInterface;
  }
}

const _abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    name: "getPriorVotes",
    outputs: [
      {
        internalType: "uint96",
        name: "",
        type: "uint96",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];
