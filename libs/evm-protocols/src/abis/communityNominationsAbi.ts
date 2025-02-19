export const communityNominationsAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_namespaceFactory', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'configureCommunitNominations',
    inputs: [
      { name: 'namespace', type: 'string', internalType: 'string' },
      { name: '_referralModeEnabled', type: 'bool', internalType: 'bool' },
      { name: '_maxNominations', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'maxNominations',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
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
    name: 'nominateJudge',
    inputs: [
      { name: 'namespace', type: 'string', internalType: 'string' },
      { name: 'judge', type: 'address', internalType: 'address' },
      { name: 'judgeId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'nominationCount',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nominatorOf',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'referralModeEnabled',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'JudgeNominated',
    inputs: [
      {
        name: 'namespace',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
      {
        name: 'judge',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'judgeId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'nominator',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'currentNominations',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'NominationsConfigured',
    inputs: [
      {
        name: 'namespace',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
      {
        name: 'referralModeEnabled',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
      {
        name: 'maxNominations',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
] as const;
