"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildBank1__factory = void 0;
const ethers_1 = require("ethers");
class GuildBank1__factory extends ethers_1.ContractFactory {
    constructor(signer) {
        super(_abi, _bytecode, signer);
    }
    deploy(approvedTokenAddress, overrides) {
        return super.deploy(approvedTokenAddress, overrides || {});
    }
    getDeployTransaction(approvedTokenAddress, overrides) {
        return super.getDeployTransaction(approvedTokenAddress, overrides || {});
    }
    attach(address) {
        return super.attach(address);
    }
    connect(signer) {
        return super.connect(signer);
    }
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.GuildBank1__factory = GuildBank1__factory;
const _abi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "approvedTokenAddress",
                type: "address",
            },
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "receiver",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "Withdrawal",
        type: "event",
    },
    {
        constant: true,
        inputs: [],
        name: "approvedToken",
        outputs: [
            {
                internalType: "contract IERC20",
                name: "",
                type: "address",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "isOwner",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "owner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            {
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "transferOwnership",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            {
                internalType: "address",
                name: "receiver",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "shares",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "totalShares",
                type: "uint256",
            },
        ],
        name: "withdraw",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
];
const _bytecode = "0x608060405234801561001057600080fd5b506040516107503803806107508339818101604052602081101561003357600080fd5b505160006100486001600160e01b036100b716565b600080546001600160a01b0319166001600160a01b0383169081178255604051929350917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a350600180546001600160a01b0319166001600160a01b03929092169190911790556100bb565b3390565b610686806100ca6000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c8063715018a6146100675780638da5cb5b146100715780638f32d59b14610095578063b5c5f672146100b1578063bab46259146100e3578063f2fde38b146100eb575b600080fd5b61006f610111565b005b6100796101b4565b604080516001600160a01b039092168252519081900360200190f35b61009d6101c3565b604080519115158252519081900360200190f35b61009d600480360360608110156100c757600080fd5b506001600160a01b0381351690602081013590604001356101e7565b6100796103ac565b61006f6004803603602081101561010157600080fd5b50356001600160a01b03166103bb565b6101196101c3565b61016a576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b600080546040516001600160a01b03909116907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a3600080546001600160a01b0319169055565b6000546001600160a01b031690565b600080546001600160a01b03166101d8610420565b6001600160a01b031614905090565b60006101f16101c3565b610242576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b600154604080516370a0823160e01b815230600482015290516000926102e09286926102d49289926001600160a01b03909116916370a0823191602480820192602092909190829003018186803b15801561029c57600080fd5b505afa1580156102b0573d6000803e3d6000fd5b505050506040513d60208110156102c657600080fd5b50519063ffffffff61042416565b9063ffffffff61048616565b6040805182815290519192506001600160a01b038716917f7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b659181900360200190a26001546040805163a9059cbb60e01b81526001600160a01b038881166004830152602482018590529151919092169163a9059cbb9160448083019260209291908290030181600087803b15801561037757600080fd5b505af115801561038b573d6000803e3d6000fd5b505050506040513d60208110156103a157600080fd5b505195945050505050565b6001546001600160a01b031681565b6103c36101c3565b610414576040805162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015290519081900360640190fd5b61041d816104c8565b50565b3390565b60008261043357506000610480565b8282028284828161044057fe5b041461047d5760405162461bcd60e51b81526004018080602001828103825260218152602001806106316021913960400191505060405180910390fd5b90505b92915050565b600061047d83836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250610568565b6001600160a01b03811661050d5760405162461bcd60e51b815260040180806020018281038252602681526020018061060b6026913960400191505060405180910390fd5b600080546040516001600160a01b03808516939216917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e091a3600080546001600160a01b0319166001600160a01b0392909216919091179055565b600081836105f45760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b838110156105b95781810151838201526020016105a1565b50505050905090810190601f1680156105e65780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b50600083858161060057fe5b049594505050505056fe4f776e61626c653a206e6577206f776e657220697320746865207a65726f2061646472657373536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f77a265627a7a72315820ceb74c16f002cccdb9bcfc5028b8d1a622d0ac391e8e685d8b190eb57d48b25864736f6c63430005100032";
//# sourceMappingURL=GuildBank1__factory.js.map