import { models } from '@hicommonwealth/model';
import { commonProtocol } from '@hicommonwealth/shared';
import Web3 from 'web3';

const abi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_launchpad', type: 'address', internalType: 'address' },
      { name: '_owner', type: 'address', internalType: 'address' },
      { name: '_namespaceFactory', type: 'address', internalType: 'address' },
      { name: '_contestManager', type: 'address', internalType: 'address' },
      { name: '_presetShares', type: 'uint256[]', internalType: 'uint256[]' },
      { name: '_defaultQuorum', type: 'uint256', internalType: 'uint256' },
      { name: '_defaultVoteDelay', type: 'uint256', internalType: 'uint256' },
      { name: '_defaultVotePeriod', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'contestManager',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'executeLaunchAction',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'symbol', type: 'string', internalType: 'string' },
      { name: 'shares', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'holders', type: 'address[]', internalType: 'address[]' },
      { name: 'totalSupply', type: 'uint256', internalType: 'uint256' },
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
      { name: 'sender', type: 'address', internalType: 'address' },
    ],
    outputs: [
      {
        name: 'result',
        type: 'tuple',
        internalType: 'struct ILaunchActionHook.LaunchActionResponse',
        components: [
          { name: 'shares', type: 'uint256[]', internalType: 'uint256[]' },
          { name: 'holders', type: 'address[]', internalType: 'address[]' },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'launchpad',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'namespaceFactory',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract INamespaceFactory' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'namespaceForToken',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'onERC1155BatchReceived',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256[]', internalType: 'uint256[]' },
      { name: '', type: 'uint256[]', internalType: 'uint256[]' },
      { name: '', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes4', internalType: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'onERC1155Received',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'address', internalType: 'address' },
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes4', internalType: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'presetShares',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setDefaultQuorum',
    inputs: [
      { name: '_defaultQuorum', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setDefaultVoteDelay',
    inputs: [
      { name: '_defaultVoteDelay', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setDefaultVotePeriod',
    inputs: [
      { name: '_defaultVotePeriod', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setLaunchpad',
    inputs: [{ name: '_launchpad', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setNamespaceFactory',
    inputs: [
      {
        name: '_namespaceFactory',
        type: 'address',
        internalType: 'contract INamespaceFactory',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setPresetShares',
    inputs: [
      { name: '_presetShares', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [{ name: 'interfaceId', type: 'bytes4', internalType: 'bytes4' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'CommunityNamespaceCreated',
    inputs: [
      { name: 'name', type: 'string', indexed: true, internalType: 'string' },
      {
        name: 'token',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'namespaceAddress',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'governanceAddress',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
];

const erc20Abi = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [
      {
        name: '',
        type: 'string',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_spender',
        type: 'address',
      },
      {
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_from',
        type: 'address',
      },
      {
        name: '_to',
        type: 'address',
      },
      {
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: '',
        type: 'uint8',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: '',
        type: 'string',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_to',
        type: 'address',
      },
      {
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
      {
        name: '_spender',
        type: 'address',
      },
    ],
    name: 'allowance',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    payable: true,
    stateMutability: 'payable',
    type: 'fallback',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        name: 'spender',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
];

async function temp(tokenAddress: string, chainNodeId: number) {
  // const chainNode = await models.ChainNode.findOne({
  //   where: { id: chainNodeId },
  //   attributes: ['eth_chain_id', 'url', 'private_url'],
  // });
  //
  // mustExist('Chain Node', chainNode);
  //
  // const web3 = new Web3(chainNode.private_url || chainNode.url);

  const web3 = new Web3('wss://base-sepolia-rpc.publicnode.com');

  const chain = 84532;

  const contracts = commonProtocol.factoryContracts[chain];
  const tokenManagerAddress = contracts.tokenCommunityManager;

  const tokenManagerContract = new web3.eth.Contract(abi, tokenManagerAddress);

  let namespaceAddress: string;
  try {
    namespaceAddress = await tokenManagerContract.methods
      .namespaceForToken(tokenAddress)
      .call();
    console.log('Namespace for Token:', namespaceAddress);
  } catch (error) {
    throw Error('Error calling namespaceForToken');
  }

  const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress);

  const name = await erc20Contract.methods.name().call();
  const symbol = await erc20Contract.methods.symbol().call();
  const totalSupply = await erc20Contract.methods.totalSupply().call();

  const createdToken = await models.Token.create({
    token_address: tokenAddress,
    namespace_address: namespaceAddress,
    name,
    symbol,
    initial_supply: totalSupply,
  });

  return createdToken;
}

temp('0xe1aa28E217A6A6Bf39F74455ddD4d24Aa4fA0aeC').then().catch(console.log);
