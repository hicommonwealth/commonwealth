/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/providers";

import type { IERC721Receiver } from "../IERC721Receiver";

export class IERC721Receiver__factory {
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IERC721Receiver {
    return new Contract(address, _abi, signerOrProvider) as IERC721Receiver;
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
        name: "tokenId",
        type: "uint256",
      },
      {
        name: "data",
        type: "bytes",
      },
    ],
    name: "onERC721Received",
    outputs: [
      {
        name: "",
        type: "bytes4",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];
