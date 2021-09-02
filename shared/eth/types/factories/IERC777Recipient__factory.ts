/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { IERC777Recipient } from "../IERC777Recipient";

export class IERC777Recipient__factory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IERC777Recipient {
    return new Contract(address, _abi, signerOrProvider) as IERC777Recipient;
  }
}

const _abi = [
  {
    constant: false,
    inputs: [
      {
        name: "operator",
        type: "address",
      },
      {
        name: "from",
        type: "address",
      },
      {
        name: "to",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
      {
        name: "userData",
        type: "bytes",
      },
      {
        name: "operatorData",
        type: "bytes",
      },
    ],
    name: "tokensReceived",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];
