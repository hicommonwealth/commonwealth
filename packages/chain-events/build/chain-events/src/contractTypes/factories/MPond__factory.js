"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MPond__factory = void 0;
const ethers_1 = require("ethers");
class MPond__factory extends ethers_1.ContractFactory {
    constructor(signer) {
        super(_abi, _bytecode, signer);
    }
    deploy(account, bridge, overrides) {
        return super.deploy(account, bridge, overrides || {});
    }
    getDeployTransaction(account, bridge, overrides) {
        return super.getDeployTransaction(account, bridge, overrides || {});
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
exports.MPond__factory = MPond__factory;
const _abi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
            {
                internalType: "address",
                name: "bridge",
                type: "address",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "Approval",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "delegator",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "fromDelegate",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "toDelegate",
                type: "address",
            },
        ],
        name: "DelegateChanged",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "delegate",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "previousBalance",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "newBalance",
                type: "uint256",
            },
        ],
        name: "DelegateVotesChanged",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "Transfer",
        type: "event",
    },
    {
        inputs: [],
        name: "DELEGATION_TYPEHASH",
        outputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "DOMAIN_TYPEHASH",
        outputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "UNDELEGATION_TYPEHASH",
        outputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_address",
                type: "address",
            },
        ],
        name: "addWhiteListAddress",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "admin",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
        ],
        name: "allowance",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "rawAmount",
                type: "uint256",
            },
        ],
        name: "approve",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "balanceOf",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "bridgeSupply",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        name: "checkpoints",
        outputs: [
            {
                internalType: "uint32",
                name: "fromBlock",
                type: "uint32",
            },
            {
                internalType: "uint96",
                name: "votes",
                type: "uint96",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "delegatee",
                type: "address",
            },
            {
                internalType: "uint96",
                name: "amount",
                type: "uint96",
            },
        ],
        name: "delegate",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "delegatee",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "nonce",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "expiry",
                type: "uint256",
            },
            {
                internalType: "uint8",
                name: "v",
                type: "uint8",
            },
            {
                internalType: "bytes32",
                name: "r",
                type: "bytes32",
            },
            {
                internalType: "bytes32",
                name: "s",
                type: "bytes32",
            },
            {
                internalType: "uint96",
                name: "amount",
                type: "uint96",
            },
        ],
        name: "delegateBySig",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "delegates",
        outputs: [
            {
                internalType: "uint96",
                name: "",
                type: "uint96",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "enableAllTranfers",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "enableAllTransfers",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "getCurrentVotes",
        outputs: [
            {
                internalType: "uint96",
                name: "",
                type: "uint96",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
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
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "isWhiteListed",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_address1",
                type: "address",
            },
            {
                internalType: "address",
                name: "_address2",
                type: "address",
            },
        ],
        name: "isWhiteListedTransfer",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "name",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "nonces",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        name: "numCheckpoints",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "symbol",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "totalSupply",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "dst",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "rawAmount",
                type: "uint256",
            },
        ],
        name: "transfer",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "src",
                type: "address",
            },
            {
                internalType: "address",
                name: "dst",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "rawAmount",
                type: "uint256",
            },
        ],
        name: "transferFrom",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "delegatee",
                type: "address",
            },
            {
                internalType: "uint96",
                name: "amount",
                type: "uint96",
            },
        ],
        name: "undelegate",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "delegatee",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "nonce",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "expiry",
                type: "uint256",
            },
            {
                internalType: "uint8",
                name: "v",
                type: "uint8",
            },
            {
                internalType: "bytes32",
                name: "r",
                type: "bytes32",
            },
            {
                internalType: "bytes32",
                name: "s",
                type: "bytes32",
            },
            {
                internalType: "uint96",
                name: "amount",
                type: "uint96",
            },
        ],
        name: "undelegateBySig",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
const _bytecode = "0x60806040526008805460ff191660011790553480156200001e57600080fd5b506040516200273238038062002732833981016040819052620000419162000229565b806001600160a01b0316826001600160a01b031614156200007f5760405162461bcd60e51b81526004016200007690620002bd565b60405180910390fd5b6001600160a01b0381166000818152600160208181526040808420805469017b7883c069166000006001600160601b031991821681179092556002845282862086805284528286208054909116821790558585526007909252808420805460ff19169093179092559051600080516020620027128339815191529162000105916200030e565b60405180910390a360006200014969021e19e0c9bab240000069017b7883c069166000006040518060600160405280602d8152602001620026e5602d9139620001e7565b6001600160a01b038416600081815260016020818152604080842080546001600160601b0388166001600160601b031991821681179092556002845282862086805284528286208054909116821790558585526007909252808420805460ff19169093179092559051939450919290916000805160206200271283398151915291620001d691906200030e565b60405180910390a350505062000330565b6000836001600160601b0316836001600160601b031611158290620002215760405162461bcd60e51b815260040162000076919062000267565b505050900390565b600080604083850312156200023c578182fd5b8251620002498162000317565b60208401519092506200025c8162000317565b809150509250929050565b6000602080835283518082850152825b81811015620002955785810183015185820160400152820162000277565b81811115620002a75783604083870101525b50601f01601f1916929092016040019392505050565b60208082526031908201527f42726964676520616e64206163636f75746e2073686f756c64206e6f74206265604082015270207468652073616d65206164647265737360781b606082015260800190565b90815260200190565b6001600160a01b03811681146200032d57600080fd5b50565b6123a580620003406000396000f3fe608060405234801561001057600080fd5b50600436106101cf5760003560e01c80637ecebe0011610104578063b9371343116100a2578063e584324211610071578063e5843242146103a5578063e7a324dc146103b8578063f1127ed8146103c0578063f851a440146103e1576101cf565b8063b93713431461036f578063c43ff0c814610377578063dd62ed3e1461037f578063e1032b8314610392576101cf565b806395d89b41116100de57806395d89b411461032e578063a65835da14610336578063a9059cbb14610349578063b4b5ea571461035c576101cf565b80637ecebe00146102f55780638164c309146103085780638b41166c1461031b576101cf565b8063313ce567116101715780636f9170f61161014b5780636f9170f61461028f5780636fcfff45146102a257806370a08231146102c2578063782d6fe1146102d5576101cf565b8063313ce5671461025f57806367cb1601146102745780636ab5cc381461027c576101cf565b806316aeac20116101ad57806316aeac201461022757806318160ddd1461023c57806320606b701461024457806323b872dd1461024c576101cf565b806302cb3a88146101d457806306fdde03146101e9578063095ea7b314610207575b600080fd5b6101e76101e2366004611ae0565b6103f6565b005b6101f1610617565b6040516101fe9190611c76565b60405180910390f35b61021a610215366004611ab6565b61064a565b6040516101fe9190611beb565b61022f610707565b6040516101fe9190611bf6565b61022f61072b565b61022f610739565b61021a61025a366004611a76565b61075d565b6102676108c6565b6040516101fe9190612148565b61021a6108cb565b61021a61028a366004611a42565b61090c565b61021a61029d366004611a27565b61095f565b6102b56102b0366004611a27565b610974565b6040516101fe9190612118565b61022f6102d0366004611a27565b61098c565b6102e86102e3366004611ab6565b6109b0565b6040516101fe9190612156565b61022f610303366004611a27565b610bbe565b61021a610316366004611a27565b610bd0565b6101e7610329366004611b91565b610c26565b6101f1610c35565b6101e7610344366004611ae0565b610c56565b61021a610357366004611ab6565b610e61565b6102e861036a366004611a27565b610ec4565b61022f610f34565b61021a610f42565b61022f61038d366004611a42565b610f4b565b6101e76103a0366004611b91565b610f7d565b6102e86103b3366004611a42565b610f88565b61022f610fae565b6103d36103ce366004611b52565b610fd2565b6040516101fe929190612129565b6103e9611007565b6040516101fe9190611bd7565b60408051808201909152601781527626b0b93634b71023b7bb32b93730b731b2902a37b5b2b760491b60209091015260007f8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a8667f59269cbca1208251d90fa95662317aad0c2a0b4ed01fd7809a1a8c310572a7d6610471611016565b306040516020016104859493929190611c34565b60405160208183030381529060405280519060200120905060007f3001685306e2a9f6f760b7c5c2d24b3cda3fd7534488f2cedcaf2728fb7d99d6898989866040516020016104d8959493929190611bff565b60405160208183030381529060405280519060200120905060008282604051602001610505929190611bbc565b6040516020818303038152906040528051906020012090506000600182898989604051600081526020016040526040516105429493929190611c58565b6020604051602081039080840390855afa158015610564573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b0381166105a05760405162461bcd60e51b8152600401610597906120d0565b60405180910390fd5b6001600160a01b03811660009081526005602052604090208054600181019091558a146105df5760405162461bcd60e51b815260040161059790611f0f565b884211156105ff5760405162461bcd60e51b815260040161059790612088565b61060a818c8761101a565b5050505050505050505050565b6040518060400160405280601781526020017626b0b93634b71023b7bb32b93730b731b2902a37b5b2b760491b81525081565b6000806000198314156106605750600019610685565b610682836040518060600160405280602581526020016121d360259139611194565b90505b336000818152602081815260408083206001600160a01b03891680855292529182902080546001600160601b0319166001600160601b03861617905590519091907f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906106f3908590612156565b60405180910390a360019150505b92915050565b7f3001685306e2a9f6f760b7c5c2d24b3cda3fd7534488f2cedcaf2728fb7d99d681565b69021e19e0c9bab240000081565b7f8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a86681565b6000610769338461090c565b6107855760405162461bcd60e51b815260040161059790611fe7565b6001600160a01b0384166000908152602081815260408083203380855290835281842054825160608101909352602580845291946001600160601b039091169390926107d99288926121d390830139611194565b9050866001600160a01b0316836001600160a01b03161415801561080657506001600160601b0382811614155b156108ae57600061083083836040518060600160405280603d815260200161230c603d91396111c3565b6001600160a01b03898116600081815260208181526040808320948a16808452949091529081902080546001600160601b0319166001600160601b0386161790555192935090917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906108a4908590612156565b60405180910390a3505b6108b9878783611202565b5060019695505050505050565b601281565b6006546000906001600160a01b031633146108f85760405162461bcd60e51b815260040161059790612044565b506008805460ff1916600190811790915590565b6001600160a01b03821660009081526007602052604081205460ff168061094b57506001600160a01b03821660009081526007602052604090205460ff165b80610958575060085460ff165b9392505050565b60076020526000908152604090205460ff1681565b60046020526000908152604090205463ffffffff1681565b6001600160a01b03166000908152600160205260409020546001600160601b031690565b60004382106109d15760405162461bcd60e51b815260040161059790611dcb565b6001600160a01b03831660009081526004602052604090205463ffffffff16806109ff576000915050610701565b6001600160a01b038416600090815260036020908152604080832063ffffffff600019860181168552925290912054168310610a7b576001600160a01b03841660009081526003602090815260408083206000199490940163ffffffff1683529290522054600160201b90046001600160601b03169050610701565b6001600160a01b038416600090815260036020908152604080832083805290915290205463ffffffff16831015610ab6576000915050610701565b600060001982015b8163ffffffff168163ffffffff161115610b7957600282820363ffffffff16048103610ae86119e2565b506001600160a01b038716600090815260036020908152604080832063ffffffff858116855290835292819020815180830190925254928316808252600160201b9093046001600160601b03169181019190915290871415610b54576020015194506107019350505050565b805163ffffffff16871115610b6b57819350610b72565b6001820392505b5050610abe565b506001600160a01b038516600090815260036020908152604080832063ffffffff909416835292905220546001600160601b03600160201b9091041691505092915050565b60056020526000908152604090205481565b6006546000906001600160a01b03163314610bfd5760405162461bcd60e51b815260040161059790611fb0565b506001600160a01b03166000908152600760205260409020805460ff1916600190811790915590565b610c313383836114bd565b5050565b60405180604001604052806005815260200164135413d39160da1b81525081565b60408051808201909152601781527626b0b93634b71023b7bb32b93730b731b2902a37b5b2b760491b60209091015260007f8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a8667f59269cbca1208251d90fa95662317aad0c2a0b4ed01fd7809a1a8c310572a7d6610cd1611016565b30604051602001610ce59493929190611c34565b60405160208183030381529060405280519060200120905060007fee15044614b31d47e846313dae86ff14f14a42386a492dcc6b086cdd1600a14a89898986604051602001610d38959493929190611bff565b60405160208183030381529060405280519060200120905060008282604051602001610d65929190611bbc565b604051602081830303815290604052805190602001209050600060018289898960405160008152602001604052604051610da29493929190611c58565b6020604051602081039080840390855afa158015610dc4573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116610df75760405162461bcd60e51b815260040161059790611d3f565b6001600160a01b03811660009081526005602052604090208054600181019091558a14610e365760405162461bcd60e51b815260040161059790611e12565b88421115610e565760405162461bcd60e51b815260040161059790611d85565b61060a818c876114bd565b6000610e6d338461090c565b610e895760405162461bcd60e51b815260040161059790611eb1565b6000610ead836040518060600160405280602681526020016121f860269139611194565b9050610eba338583611202565b5060019392505050565b6001600160a01b03811660009081526004602052604081205463ffffffff1680610eef576000610958565b6001600160a01b0383166000908152600360209081526040808320600019850163ffffffff168452909152902054600160201b90046001600160601b03169392505050565b69017b7883c0691660000081565b60085460ff1681565b6001600160a01b039182166000908152602081815260408083209390941682529190915220546001600160601b031690565b610c3133838361101a565b60026020908152600092835260408084209091529082529020546001600160601b031681565b7fee15044614b31d47e846313dae86ff14f14a42386a492dcc6b086cdd1600a14a81565b600360209081526000928352604080842090915290825290205463ffffffff811690600160201b90046001600160601b031682565b6006546001600160a01b031681565b4690565b6001600160a01b038084166000908152600260209081526040808320938616835292815290829020548251808401909352601b83527f436f6d703a20756e64656c65676174657320756e646572666c6f7700000000009183019190915261108e916001600160601b039091169083906111c3565b6001600160a01b038481166000908152600260209081526040808320938716835292815282822080546001600160601b0319166001600160601b03958616179055818052908290205482518084019093526019835278436f6d703a2064656c65676174657320756e646572666c6f7760381b918301919091526111149216908390611630565b6001600160a01b03848116600081815260026020908152604080832083805290915280822080546001600160601b0319166001600160601b0396909616959095179094559251918516917f3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f908490a461118f8260008361166c565b505050565b600081600160601b84106111bb5760405162461bcd60e51b81526004016105979190611c76565b509192915050565b6000836001600160601b0316836001600160601b0316111582906111fa5760405162461bcd60e51b81526004016105979190611c76565b505050900390565b6001600160a01b0383166112285760405162461bcd60e51b815260040161059790611f53565b6001600160a01b03831660009081526002602090815260408083208380529091529020546001600160601b03808316911610156112775760405162461bcd60e51b815260040161059790611cc9565b6001600160a01b03821661129d5760405162461bcd60e51b815260040161059790611e54565b6001600160a01b0383166000908152600160209081526040918290205482516060810190935260368084526112e8936001600160601b03909216928592919061219d908301396111c3565b6001600160a01b038416600090815260016020908152604080832080546001600160601b0319166001600160601b039586161790556002825280832083805282529182902054825160608101909352603280845261135694919091169285929091906122da908301396111c3565b6001600160a01b038481166000908152600260209081526040808320838052825280832080546001600160601b0319166001600160601b03968716179055928616825260018152908290205482516060810190935260308084526113ca94919091169285929091906122aa90830139611630565b6001600160a01b038316600090815260016020908152604080832080546001600160601b0319166001600160601b0395861617905560028252808320838052825291829020548251606081019093526030808452611438949190911692859290919061225290830139611630565b6001600160a01b0383811660008181526002602090815260408083208380529091529081902080546001600160601b0319166001600160601b0395909516949094179093559151908516907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906114b0908590612156565b60405180910390a3505050565b6001600160a01b03831660009081526002602090815260408083208380528252918290205482518084019093526019835278436f6d703a2064656c65676174657320756e646572666c6f7760381b91830191909152611529916001600160601b039091169083906111c3565b6001600160a01b038481166000908152600260209081526040808320838052825280832080546001600160601b0319166001600160601b03968716179055928616825290829020548251808401909352601883527f436f6d703a2064656c656761746573206f766572666c6f770000000000000000918301919091526115b29216908390611630565b6001600160a01b0384811660008181526002602090815260408083209488168084529490915280822080546001600160601b0319166001600160601b03969096169590951790945592519192917f3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f908390a461118f6000838361166c565b6000838301826001600160601b0380871690831610156116635760405162461bcd60e51b81526004016105979190611c76565b50949350505050565b816001600160a01b0316836001600160a01b03161415801561169757506000816001600160601b0316115b1561118f576001600160a01b0383161561174f576001600160a01b03831660009081526004602052604081205463ffffffff1690816116d7576000611716565b6001600160a01b0385166000908152600360209081526040808320600019860163ffffffff168452909152902054600160201b90046001600160601b03165b9050600061173d8285604051806060016040528060288152602001612282602891396111c3565b905061174b86848484611806565b5050505b6001600160a01b0382161561118f576001600160a01b03821660009081526004602052604081205463ffffffff16908161178a5760006117c9565b6001600160a01b0384166000908152600360209081526040808320600019860163ffffffff168452909152902054600160201b90046001600160601b03165b905060006117f0828560405180606001604052806027815260200161234960279139611630565b90506117fe85848484611806565b505050505050565b600061182a4360405180606001604052806034815260200161221e603491396119bb565b905060008463ffffffff1611801561187357506001600160a01b038516600090815260036020908152604080832063ffffffff6000198901811685529252909120548282169116145b156118d2576001600160a01b0385166000908152600360209081526040808320600019880163ffffffff168452909152902080546fffffffffffffffffffffffff000000001916600160201b6001600160601b03851602179055611971565b60408051808201825263ffffffff80841682526001600160601b0380861660208085019182526001600160a01b038b166000818152600383528781208c871682528352878120965187549451909516600160201b026fffffffffffffffffffffffff000000001995871663ffffffff19958616179590951694909417909555938252600490935292909220805460018801909316929091169190911790555b846001600160a01b03167fdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a72484846040516119ac92919061216a565b60405180910390a25050505050565b600081600160201b84106111bb5760405162461bcd60e51b81526004016105979190611c76565b604080518082019091526000808252602082015290565b80356001600160a01b038116811461070157600080fd5b80356001600160601b038116811461070157600080fd5b600060208284031215611a38578081fd5b61095883836119f9565b60008060408385031215611a54578081fd5b611a5e84846119f9565b9150611a6d84602085016119f9565b90509250929050565b600080600060608486031215611a8a578081fd5b8335611a9581612184565b92506020840135611aa581612184565b929592945050506040919091013590565b60008060408385031215611ac8578182fd5b611ad284846119f9565b946020939093013593505050565b600080600080600080600060e0888a031215611afa578283fd5b611b0489896119f9565b96506020880135955060408801359450606088013560ff81168114611b27578384fd5b93506080880135925060a08801359150611b448960c08a01611a10565b905092959891949750929550565b60008060408385031215611b64578182fd5b611b6e84846119f9565b9150602083013563ffffffff81168114611b86578182fd5b809150509250929050565b60008060408385031215611ba3578182fd5b611bad84846119f9565b9150611a6d8460208501611a10565b61190160f01b81526002810192909252602282015260420190565b6001600160a01b0391909116815260200190565b901515815260200190565b90815260200190565b9485526001600160a01b03939093166020850152604084019190915260608301526001600160601b0316608082015260a00190565b938452602084019290925260408301526001600160a01b0316606082015260800190565b93845260ff9290921660208401526040830152606082015260800190565b6000602080835283518082850152825b81811015611ca257858101830151858201604001528201611c86565b81811115611cb35783604083870101525b50601f01601f1916929092016040019392505050565b60208082526050908201527f436f6d703a205f7472616e73666572546f6b656e733a20756e64656c6567617460408201527f656420616d6f756e742073686f756c642062652067726561746572207468616e60608201526f081d1c985b9cd9995c88185b5bdd5b9d60821b608082015260a00190565b60208082526026908201527f436f6d703a3a64656c656761746542795369673a20696e76616c6964207369676040820152656e617475726560d01b606082015260800190565b60208082526026908201527f436f6d703a3a64656c656761746542795369673a207369676e617475726520656040820152651e1c1a5c995960d21b606082015260800190565b60208082526027908201527f436f6d703a3a6765745072696f72566f7465733a206e6f742079657420646574604082015266195c9b5a5b995960ca1b606082015260800190565b60208082526022908201527f436f6d703a3a64656c656761746542795369673a20696e76616c6964206e6f6e604082015261636560f01b606082015260800190565b6020808252603a908201527f436f6d703a3a5f7472616e73666572546f6b656e733a2063616e6e6f7420747260408201527f616e7366657220746f20746865207a65726f2061646472657373000000000000606082015260800190565b602080825260409082018190527f41746c65617374206f6620746865206164647265737320286d73672e73656e64908201527f6572206f7220647374292073686f756c642062652077686974656c6973746564606082015260800190565b60208082526024908201527f436f6d703a3a756e64656c656761746542795369673a20696e76616c6964206e6040820152636f6e636560e01b606082015260800190565b6020808252603c908201527f436f6d703a3a5f7472616e73666572546f6b656e733a2063616e6e6f7420747260408201527f616e736665722066726f6d20746865207a65726f206164647265737300000000606082015260800190565b60208082526018908201527f4f6e6c792061646d696e2063616e2077686974656c6973740000000000000000604082015260600190565b60208082526039908201527f41746c65617374206f662074686520616464726573732028737263206f72206460408201527f7374292073686f756c642062652077686974656c697374656400000000000000606082015260800190565b60208082526024908201527f4f6e6c7920656e61626c652063616e20656e61626c6520616c6c207472616e736040820152636665727360e01b606082015260800190565b60208082526028908201527f436f6d703a3a756e64656c656761746542795369673a207369676e617475726560408201526708195e1c1a5c995960c21b606082015260800190565b60208082526028908201527f436f6d703a3a756e64656c656761746542795369673a20696e76616c6964207360408201526769676e617475726560c01b606082015260800190565b63ffffffff91909116815260200190565b63ffffffff9290921682526001600160601b0316602082015260400190565b60ff91909116815260200190565b6001600160601b0391909116815260200190565b6001600160601b0392831681529116602082015260400190565b6001600160a01b038116811461219957600080fd5b5056fe436f6d703a3a5f7472616e73666572546f6b656e733a207472616e7366657220616d6f756e7420657863656564732062616c616e6365436f6d703a3a617070726f76653a20616d6f756e7420657863656564732039362062697473436f6d703a3a7472616e736665723a20616d6f756e7420657863656564732039362062697473436f6d703a3a5f7772697465436865636b706f696e743a20626c6f636b206e756d62657220657863656564732033322062697473436f6d703a205f7472616e73666572546f6b656e733a20756e64656c6567617465206164646974696f6e206572726f72436f6d703a3a5f6d6f7665566f7465733a20766f746520616d6f756e7420756e646572666c6f7773436f6d703a3a5f7472616e73666572546f6b656e733a207472616e7366657220616d6f756e74206f766572666c6f7773436f6d703a205f7472616e666572546f6b656e733a20756e64656c6567617465207375627472616374696f6e206572726f72436f6d703a3a7472616e7366657246726f6d3a207472616e7366657220616d6f756e742065786365656473207370656e64657220616c6c6f77616e6365436f6d703a3a5f6d6f7665566f7465733a20766f746520616d6f756e74206f766572666c6f7773a2646970667358221220ac45491b4f5299399623af40ff3b35539f580eca66e68ed00d923e73b2bed40664736f6c634300060c0033436f6d703a205375627472616374696f6e206f766572666c6f7720696e2074686520636f6e7374727563746f72ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
