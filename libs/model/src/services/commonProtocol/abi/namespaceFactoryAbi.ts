export const deployedNamespaceEventAbi = {
  name: 'DeployedNamespace',
  type: 'event',
  inputs: [
    { name: 'name', type: 'string', indexed: false, internalType: 'string' },
    {
      name: '_feeManager',
      type: 'address',
      indexed: false,
      internalType: 'address',
    },
    {
      name: '_signature',
      type: 'bytes',
      indexed: false,
      internalType: 'bytes',
    },
    {
      name: '_namespaceDeployer',
      type: 'address',
      indexed: false,
      internalType: 'address',
    },
  ],
  anonymous: false,
} as const;

export const namespaceFactoryAbi = [
  { name: 'InvalidInitialization', type: 'error', inputs: [] },
  {
    name: 'NotInitializing',
    type: 'error',
    inputs: [],
  },
  {
    name: 'ConfiguredCommunityStakeId',
    type: 'event',
    inputs: [
      { name: 'name', type: 'string', indexed: false, internalType: 'string' },
      {
        name: 'tokenName',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
      { name: 'id', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  deployedNamespaceEventAbi,
  {
    name: 'Initialized',
    type: 'event',
    inputs: [
      {
        name: 'version',
        type: 'uint64',
        indexed: false,
        internalType: 'uint64',
      },
    ],
    anonymous: false,
  },
  {
    name: 'NewContest',
    type: 'event',
    inputs: [
      {
        name: 'contest',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'namespace',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'interval',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      { name: 'oneOff', type: 'bool', indexed: false, internalType: 'bool' },
    ],
    anonymous: false,
  },
  {
    name: 'CurveManager',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'communityStake',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'configureCommunityStakeId',
    type: 'function',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      {
        name: 'tokenName',
        type: 'string',
        internalType: 'string',
      },
      { name: 'id', type: 'uint256', internalType: 'uint256' },
      {
        name: 'exchangeToken',
        type: 'address',
        internalType: 'address',
      },
      { name: 'scalar', type: 'uint256', internalType: 'uint256' },
      {
        name: 'curve',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'contestFactoryUtil',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract IContestFactoryUtils',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'deployNamespace',
    type: 'function',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      {
        name: '_uri',
        type: 'string',
        internalType: 'string',
      },
      { name: '_feeManager', type: 'address', internalType: 'address' },
      {
        name: '_signature',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getNamespace',
    type: 'function',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'initialize',
    type: 'function',
    inputs: [
      { name: '_communityStake', type: 'address', internalType: 'address' },
      {
        name: '_namespaceLogic',
        type: 'address',
        internalType: 'address',
      },
      { name: '_reservationHook', type: 'address', internalType: 'address' },
      {
        name: '_curveManager',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'namespaceLogic',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'namespaceVotingStrategy',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract INamespaceVoteStrategy',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'newContest',
    type: 'function',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      {
        name: 'interval',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'winnerShares', type: 'uint256[]', internalType: 'uint256[]' },
      {
        name: 'id',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'prizeShare', type: 'uint256', internalType: 'uint256' },
      {
        name: 'voterShare',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'feeShare', type: 'uint256', internalType: 'uint256' },
      {
        name: 'weight',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'newSingleContest',
    type: 'function',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      {
        name: 'length',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'winnerShares', type: 'uint256[]', internalType: 'uint256[]' },
      {
        name: 'id',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'voterShare', type: 'uint256', internalType: 'uint256' },
      {
        name: 'weight',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'exhangeToken', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'onERC1155BatchReceived',
    type: 'function',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
      { name: '', type: 'uint256[]', internalType: 'uint256[]' },
      {
        name: '',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      { name: '', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes4', internalType: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'onERC1155Received',
    type: 'function',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
      { name: '', type: 'uint256', internalType: 'uint256' },
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: '', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes4', internalType: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'reinitialize',
    type: 'function',
    inputs: [
      {
        name: '_namespaceVotingStrategy',
        type: 'address',
        internalType: 'address',
      },
      { name: '_contestFactoryUtil', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'reservationHook',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'setReservationHook',
    type: 'function',
    inputs: [{ name: '_hook', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'supportsInterface',
    type: 'function',
    inputs: [{ name: 'interfaceId', type: 'bytes4', internalType: 'bytes4' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    name: 'transferOwnership',
    type: 'function',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'updateContestUtilImplementation',
    type: 'function',
    inputs: [{ name: 'newUtil', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'updateNamespaceImplementation',
    type: 'function',
    inputs: [
      { name: 'newImplementation', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
