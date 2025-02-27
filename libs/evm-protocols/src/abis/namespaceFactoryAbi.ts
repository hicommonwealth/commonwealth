export const namespaceFactoryAbi = [
  { inputs: [], name: 'InvalidInitialization', type: 'error' },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      {
        indexed: false,
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'ConfiguredCommunityStakeId',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      {
        indexed: false,
        internalType: 'address',
        name: '_feeManager',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: '_signature',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'address',
        name: '_namespaceDeployer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'nameSpaceAddress',
        type: 'address',
      },
    ],
    name: 'DeployedNamespace',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'feeManager',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'referrer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'referralFeeManager',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'namespaceDeployer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'nameSpaceAddress',
        type: 'address',
      },
    ],
    name: 'DeployedNamespaceWithReferral',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'contest',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'namespace',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'interval',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'oneOff',
        type: 'bool',
      },
    ],
    name: 'NewContest',
    type: 'event',
  },
  {
    inputs: [],
    name: 'CurveManager',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'communityStake',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      {
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'address',
        name: 'exchangeToken',
        type: 'address',
      },
      { internalType: 'uint256', name: 'scalar', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'curve',
        type: 'uint256',
      },
    ],
    name: 'configureCommunityStakeId',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contestFactoryUtil',
    outputs: [
      {
        internalType: 'contract IContestFactoryUtils',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      {
        internalType: 'string',
        name: '_uri',
        type: 'string',
      },
      { internalType: 'address', name: '_feeManager', type: 'address' },
      {
        internalType: 'bytes',
        name: '_signature',
        type: 'bytes',
      },
    ],
    name: 'deployNamespace',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      {
        internalType: 'string',
        name: '_uri',
        type: 'string',
      },
      { internalType: 'address', name: '_feeManager', type: 'address' },
      {
        internalType: 'address',
        name: 'referrer',
        type: 'address',
      },
      { internalType: 'bytes', name: '_signature', type: 'bytes' },
    ],
    name: 'deployNamespaceWithReferrer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'erc20VoteStrategy',
    outputs: [
      {
        internalType: 'contract IERC20VoteStrategy',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'getNamespace',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_communityStake',
        type: 'address',
      },
      { internalType: 'address', name: '_namespaceLogic', type: 'address' },
      {
        internalType: 'address',
        name: '_reservationHook',
        type: 'address',
      },
      { internalType: 'address', name: '_curveManager', type: 'address' },
      {
        internalType: 'address',
        name: '_namespaceVotingStrategy',
        type: 'address',
      },
      { internalType: 'address', name: '_contestFactoryUtil', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'namespaceLogic',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'namespaceVotingStrategy',
    outputs: [
      {
        internalType: 'contract INamespaceVoteStrategy',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      {
        internalType: 'uint256',
        name: 'interval',
        type: 'uint256',
      },
      { internalType: 'uint256[]', name: 'winnerShares', type: 'uint256[]' },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      { internalType: 'uint256', name: 'prizeShare', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'voterShare',
        type: 'uint256',
      },
      { internalType: 'uint256', name: 'feeShare', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'weight',
        type: 'uint256',
      },
    ],
    name: 'newContest',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      {
        internalType: 'uint256',
        name: 'length',
        type: 'uint256',
      },
      { internalType: 'uint256[]', name: 'winnerShares', type: 'uint256[]' },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      { internalType: 'uint256', name: 'voterShare', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'weight',
        type: 'uint256',
      },
      { internalType: 'address', name: 'exhangeToken', type: 'address' },
    ],
    name: 'newSingleContest',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      {
        internalType: 'uint256',
        name: 'length',
        type: 'uint256',
      },
      { internalType: 'uint256[]', name: 'winnerShares', type: 'uint256[]' },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      { internalType: 'uint256', name: 'voterShare', type: 'uint256' },
      {
        internalType: 'address',
        name: 'exhangeToken',
        type: 'address',
      },
    ],
    name: 'newSingleERC20Contest',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      { internalType: 'uint256', name: '', type: 'uint256' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'referralFeeManager',
    outputs: [
      {
        internalType: 'contract IReferralFeeManager',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_erc20VoteStrategy', type: 'address' },
    ],
    name: 'reinitialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reservationHook',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_hook', type: 'address' }],
    name: 'setReservationHook',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newUtil', type: 'address' }],
    name: 'updateContestUtilImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'newImplementation', type: 'address' },
    ],
    name: 'updateNamespaceImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address payable',
        name: '_referralManager',
        type: 'address',
      },
    ],
    name: 'updateReferralManager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'uint256', name: 'length', type: 'uint256' },
      { internalType: 'uint256[]', name: 'winnerShares', type: 'uint256[]' },
      { internalType: 'uint256', name: 'voterShare', type: 'uint256' },
      { internalType: 'address', name: 'exhangeToken', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'newSingleJudgedContest',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'configureNominationStrategy',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'maxNominations', type: 'uint256', internalType: 'uint256' },
      { name: 'referralModeEnabled', type: 'bool', internalType: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;
