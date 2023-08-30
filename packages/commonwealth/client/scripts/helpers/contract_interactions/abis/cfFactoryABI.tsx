const cfFactoryAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_owner',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: '_acceptedTokens',
        type: 'address[]',
      },
      {
        internalType: 'uint8',
        name: '_protocolFee',
        type: 'uint8',
      },
      {
        internalType: 'address',
        name: '_feeTo',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_projectImp',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_admin',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_pauseGuardian',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_snapshotSpace',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_snapshotVoteStrategy',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_snapshotExecutor',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_farcasterRegistry',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'action',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'pauseState',
        type: 'bool',
      },
    ],
    name: 'ActionPaused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldAdmin',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
    ],
    name: 'NewAdmin',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldPauseGuardian',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newPauseGuardian',
        type: 'address',
      },
    ],
    name: 'NewPauseGuardian',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'projectIndex',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'projectAddress',
        type: 'address',
      },
    ],
    name: 'ProjectCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldAddr',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newAddr',
        type: 'address',
      },
    ],
    name: 'ProjectImplChange',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint8',
        name: 'oldFee',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint8',
        name: 'newFee',
        type: 'uint8',
      },
    ],
    name: 'ProtocolFeeChange',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldAddr',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newAddr',
        type: 'address',
      },
    ],
    name: 'ProtocolFeeToChange',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldAddr',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newAddr',
        type: 'address',
      },
    ],
    name: 'ProtocolTokenImplChange',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'acceptedTokens',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'tokens',
        type: 'address[]',
      },
    ],
    name: 'addAcceptedTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'bytes32',
            name: '_name',
            type: 'bytes32',
          },
          {
            internalType: 'bytes32',
            name: '_ipfsHash',
            type: 'bytes32',
          },
          {
            internalType: 'bytes32',
            name: '_url',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: '_beneficiary',
            type: 'address',
          },
          {
            internalType: 'address',
            name: '_acceptedToken',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: '_threshold',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: '_deadline',
            type: 'uint256',
          },
        ],
        internalType: 'struct DataTypes.ProjectCreateData',
        name: 'projectData',
        type: 'tuple',
      },
      {
        internalType: 'address',
        name: 'communityWallet',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_farcasterId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'min',
        type: 'uint256',
      },
    ],
    name: 'createProject',
    outputs: [
      {
        internalType: 'address',
        name: 'newProject',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'createProjectGuardianPaused',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAcceptedTokens',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'isAcceptedToken',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'numProjects',
    outputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'projectImp',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint32',
        name: '',
        type: 'uint32',
      },
    ],
    name: 'projects',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolData',
    outputs: [
      {
        internalType: 'uint8',
        name: 'fee',
        type: 'uint8',
      },
      {
        internalType: 'address',
        name: 'feeTo',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'admin',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'pauseGuardian',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
    ],
    name: 'setAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: 'state',
        type: 'bool',
      },
    ],
    name: 'setCreateProjectPaused',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'feeTo',
        type: 'address',
      },
    ],
    name: 'setFeeTo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newPauseGuardian',
        type: 'address',
      },
    ],
    name: 'setPauseGuardian',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newProjectImpl',
        type: 'address',
      },
    ],
    name: 'setProjectImpl',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'protocolFee',
        type: 'uint8',
      },
    ],
    name: 'setProtocolFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_space',
        type: 'address',
      },
    ],
    name: 'setSpace',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export default cfFactoryAbi;
