const spaceAbi = [
  { inputs: [], name: 'ArrayLengthMismatch', type: 'error' },
  { inputs: [], name: 'AuthenticatorNotWhitelisted', type: 'error' },
  {
    inputs: [{ internalType: 'uint8', name: 'index', type: 'uint8' }],
    name: 'DuplicateFound',
    type: 'error',
  },
  { inputs: [], name: 'EmptyArray', type: 'error' },
  { inputs: [], name: 'ExceedsStrategyLimit', type: 'error' },
  { inputs: [], name: 'FailedToPassProposalValidation', type: 'error' },
  { inputs: [], name: 'InvalidCaller', type: 'error' },
  {
    inputs: [
      { internalType: 'uint32', name: 'minVotingDuration', type: 'uint32' },
      { internalType: 'uint32', name: 'maxVotingDuration', type: 'uint32' },
    ],
    name: 'InvalidDuration',
    type: 'error',
  },
  { inputs: [], name: 'InvalidPayload', type: 'error' },
  { inputs: [], name: 'InvalidProposal', type: 'error' },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'InvalidStrategyIndex',
    type: 'error',
  },
  { inputs: [], name: 'NoActiveVotingStrategies', type: 'error' },
  { inputs: [], name: 'ProposalFinalized', type: 'error' },
  { inputs: [], name: 'UserAlreadyVoted', type: 'error' },
  { inputs: [], name: 'UserHasNoVotingPower', type: 'error' },
  { inputs: [], name: 'VotingDelayHasPassed', type: 'error' },
  { inputs: [], name: 'VotingPeriodHasEnded', type: 'error' },
  { inputs: [], name: 'VotingPeriodHasNotStarted', type: 'error' },
  { inputs: [], name: 'ZeroAddress', type: 'error' },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'previousAdmin',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
    ],
    name: 'AdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address[]',
        name: 'newAuthenticators',
        type: 'address[]',
      },
    ],
    name: 'AuthenticatorsAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address[]',
        name: 'authenticators',
        type: 'address[]',
      },
    ],
    name: 'AuthenticatorsRemoved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'beacon',
        type: 'address',
      },
    ],
    name: 'BeaconUpgraded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'newDaoURI',
        type: 'string',
      },
    ],
    name: 'DaoURIUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint8', name: 'version', type: 'uint8' },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint32',
        name: 'newMaxVotingDuration',
        type: 'uint32',
      },
    ],
    name: 'MaxVotingDurationUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'newMetadataURI',
        type: 'string',
      },
    ],
    name: 'MetadataURIUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint32',
        name: 'newMinVotingDuration',
        type: 'uint32',
      },
    ],
    name: 'MinVotingDurationUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'ProposalCancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'author',
        type: 'address',
      },
      {
        components: [
          { internalType: 'address', name: 'author', type: 'address' },
          { internalType: 'uint32', name: 'startBlockNumber', type: 'uint32' },
          {
            internalType: 'contract IExecutionStrategy',
            name: 'executionStrategy',
            type: 'address',
          },
          { internalType: 'uint32', name: 'minEndBlockNumber', type: 'uint32' },
          { internalType: 'uint32', name: 'maxEndBlockNumber', type: 'uint32' },
          {
            internalType: 'enum FinalizationStatus',
            name: 'finalizationStatus',
            type: 'uint8',
          },
          {
            internalType: 'bytes32',
            name: 'executionPayloadHash',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'activeVotingStrategies',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'selectedVotingStrategies',
            type: 'uint256',
          },
          {
            internalType: 'uint8[]',
            name: 'enumeratedVotingStrategies',
            type: 'uint8[]',
          },
        ],
        indexed: false,
        internalType: 'struct Proposal',
        name: 'proposal',
        type: 'tuple',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'metadataUri',
        type: 'string',
      },
      { indexed: false, internalType: 'bytes', name: 'payload', type: 'bytes' },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'ProposalExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        components: [
          { internalType: 'address', name: 'addr', type: 'address' },
          { internalType: 'bytes', name: 'params', type: 'bytes' },
        ],
        indexed: false,
        internalType: 'struct Strategy',
        name: 'newExecutionStrategy',
        type: 'tuple',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'newMetadataURI',
        type: 'string',
      },
    ],
    name: 'ProposalUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'addr', type: 'address' },
          { internalType: 'bytes', name: 'params', type: 'bytes' },
        ],
        indexed: false,
        internalType: 'struct Strategy',
        name: 'newProposalValidationStrategy',
        type: 'tuple',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'newProposalValidationStrategyMetadataURI',
        type: 'string',
      },
    ],
    name: 'ProposalValidationStrategyUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'space',
        type: 'address',
      },
      {
        components: [
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'uint32', name: 'votingDelay', type: 'uint32' },
          { internalType: 'uint32', name: 'minVotingDuration', type: 'uint32' },
          { internalType: 'uint32', name: 'maxVotingDuration', type: 'uint32' },
          {
            components: [
              { internalType: 'address', name: 'addr', type: 'address' },
              { internalType: 'bytes', name: 'params', type: 'bytes' },
            ],
            internalType: 'struct Strategy',
            name: 'proposalValidationStrategy',
            type: 'tuple',
          },
          {
            internalType: 'string',
            name: 'proposalValidationStrategyMetadataURI',
            type: 'string',
          },
          { internalType: 'string', name: 'daoURI', type: 'string' },
          { internalType: 'string', name: 'metadataURI', type: 'string' },
          {
            components: [
              { internalType: 'address', name: 'addr', type: 'address' },
              { internalType: 'bytes', name: 'params', type: 'bytes' },
            ],
            internalType: 'struct Strategy[]',
            name: 'votingStrategies',
            type: 'tuple[]',
          },
          {
            internalType: 'string[]',
            name: 'votingStrategyMetadataURIs',
            type: 'string[]',
          },
          {
            internalType: 'address[]',
            name: 'authenticators',
            type: 'address[]',
          },
        ],
        indexed: false,
        internalType: 'struct InitializeCalldata',
        name: 'input',
        type: 'tuple',
      },
    ],
    name: 'SpaceCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'implementation',
        type: 'address',
      },
    ],
    name: 'Upgraded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'enum Choice',
        name: 'choice',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'votingPower',
        type: 'uint256',
      },
    ],
    name: 'VoteCast',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'enum Choice',
        name: 'choice',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'votingPower',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'metadataUri',
        type: 'string',
      },
    ],
    name: 'VoteCastWithMetadata',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint32',
        name: 'newVotingDelay',
        type: 'uint32',
      },
    ],
    name: 'VotingDelayUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'addr', type: 'address' },
          { internalType: 'bytes', name: 'params', type: 'bytes' },
        ],
        indexed: false,
        internalType: 'struct Strategy[]',
        name: 'newVotingStrategies',
        type: 'tuple[]',
      },
      {
        indexed: false,
        internalType: 'string[]',
        name: 'newVotingStrategyMetadataURIs',
        type: 'string[]',
      },
    ],
    name: 'VotingStrategiesAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint8[]',
        name: 'votingStrategyIndices',
        type: 'uint8[]',
      },
    ],
    name: 'VotingStrategiesRemoved',
    type: 'event',
  },
  {
    inputs: [],
    name: 'activeVotingStrategies',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'auth', type: 'address' }],
    name: 'authenticators',
    outputs: [{ internalType: 'uint256', name: 'allowed', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'daoURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { internalType: 'bytes', name: 'executionPayload', type: 'bytes' },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }],
    name: 'getProposalStatus',
    outputs: [{ internalType: 'enum ProposalStatus', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'uint32', name: 'votingDelay', type: 'uint32' },
          { internalType: 'uint32', name: 'minVotingDuration', type: 'uint32' },
          { internalType: 'uint32', name: 'maxVotingDuration', type: 'uint32' },
          {
            components: [
              { internalType: 'address', name: 'addr', type: 'address' },
              { internalType: 'bytes', name: 'params', type: 'bytes' },
            ],
            internalType: 'struct Strategy',
            name: 'proposalValidationStrategy',
            type: 'tuple',
          },
          {
            internalType: 'string',
            name: 'proposalValidationStrategyMetadataURI',
            type: 'string',
          },
          { internalType: 'string', name: 'daoURI', type: 'string' },
          { internalType: 'string', name: 'metadataURI', type: 'string' },
          {
            components: [
              { internalType: 'address', name: 'addr', type: 'address' },
              { internalType: 'bytes', name: 'params', type: 'bytes' },
            ],
            internalType: 'struct Strategy[]',
            name: 'votingStrategies',
            type: 'tuple[]',
          },
          {
            internalType: 'string[]',
            name: 'votingStrategyMetadataURIs',
            type: 'string[]',
          },
          {
            internalType: 'address[]',
            name: 'authenticators',
            type: 'address[]',
          },
        ],
        internalType: 'struct InitializeCalldata',
        name: 'input',
        type: 'tuple',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxVotingDuration',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minVotingDuration',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextProposalId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextVotingStrategyIndex',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proposalValidationStrategy',
    outputs: [
      { internalType: 'address', name: 'addr', type: 'address' },
      { internalType: 'bytes', name: 'params', type: 'bytes' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      { internalType: 'address', name: 'author', type: 'address' },
      { internalType: 'uint32', name: 'startBlockNumber', type: 'uint32' },
      {
        internalType: 'contract IExecutionStrategy',
        name: 'executionStrategy',
        type: 'address',
      },
      { internalType: 'uint32', name: 'minEndBlockNumber', type: 'uint32' },
      { internalType: 'uint32', name: 'maxEndBlockNumber', type: 'uint32' },
      {
        internalType: 'enum FinalizationStatus',
        name: 'finalizationStatus',
        type: 'uint8',
      },
      {
        internalType: 'bytes32',
        name: 'executionPayloadHash',
        type: 'bytes32',
      },
      {
        internalType: 'uint256',
        name: 'activeVotingStrategies',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'selectedVotingStrategies',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'author', type: 'address' },
      { internalType: 'string', name: 'metadataURI', type: 'string' },
      {
        components: [
          { internalType: 'address', name: 'addr', type: 'address' },
          { internalType: 'bytes', name: 'params', type: 'bytes' },
        ],
        internalType: 'struct Strategy',
        name: 'executionStrategy',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'userProposalValidationParams',
        type: 'bytes',
      },
      {
        internalType: 'uint8[]',
        name: 'selectedVotingStrategiesIndices',
        type: 'uint8[]',
      },
    ],
    name: 'propose',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [
      { internalType: 'address', name: 'author', type: 'address' },
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      {
        components: [
          { internalType: 'address', name: 'addr', type: 'address' },
          { internalType: 'bytes', name: 'params', type: 'bytes' },
        ],
        internalType: 'struct Strategy',
        name: 'executionStrategy',
        type: 'tuple',
      },
      { internalType: 'string', name: 'metadataURI', type: 'string' },
    ],
    name: 'updateProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint32', name: 'minVotingDuration', type: 'uint32' },
          { internalType: 'uint32', name: 'maxVotingDuration', type: 'uint32' },
          { internalType: 'uint32', name: 'votingDelay', type: 'uint32' },
          { internalType: 'string', name: 'metadataURI', type: 'string' },
          { internalType: 'string', name: 'daoURI', type: 'string' },
          {
            components: [
              { internalType: 'address', name: 'addr', type: 'address' },
              { internalType: 'bytes', name: 'params', type: 'bytes' },
            ],
            internalType: 'struct Strategy',
            name: 'proposalValidationStrategy',
            type: 'tuple',
          },
          {
            internalType: 'string',
            name: 'proposalValidationStrategyMetadataURI',
            type: 'string',
          },
          {
            internalType: 'address[]',
            name: 'authenticatorsToAdd',
            type: 'address[]',
          },
          {
            internalType: 'address[]',
            name: 'authenticatorsToRemove',
            type: 'address[]',
          },
          {
            components: [
              { internalType: 'address', name: 'addr', type: 'address' },
              { internalType: 'bytes', name: 'params', type: 'bytes' },
            ],
            internalType: 'struct Strategy[]',
            name: 'votingStrategiesToAdd',
            type: 'tuple[]',
          },
          {
            internalType: 'string[]',
            name: 'votingStrategyMetadataURIsToAdd',
            type: 'string[]',
          },
          {
            internalType: 'uint8[]',
            name: 'votingStrategiesToRemove',
            type: 'uint8[]',
          },
        ],
        internalType: 'struct UpdateSettingsCalldata',
        name: 'input',
        type: 'tuple',
      },
    ],
    name: 'updateSettings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'newImplementation', type: 'address' },
    ],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'newImplementation', type: 'address' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'voter', type: 'address' },
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { internalType: 'enum Choice', name: 'choice', type: 'uint8' },
      {
        components: [
          { internalType: 'uint8', name: 'index', type: 'uint8' },
          { internalType: 'bytes', name: 'params', type: 'bytes' },
        ],
        internalType: 'struct IndexedStrategy[]',
        name: 'userVotingStrategies',
        type: 'tuple[]',
      },
      { internalType: 'string', name: 'metadataURI', type: 'string' },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { internalType: 'enum Choice', name: 'choice', type: 'uint8' },
    ],
    name: 'votePower',
    outputs: [{ internalType: 'uint256', name: 'votePower', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { internalType: 'address', name: 'voter', type: 'address' },
    ],
    name: 'voteRegistry',
    outputs: [{ internalType: 'uint256', name: 'hasVoted', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingDelay',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint8', name: 'strategyIndex', type: 'uint8' }],
    name: 'votingStrategies',
    outputs: [
      { internalType: 'address', name: 'addr', type: 'address' },
      { internalType: 'bytes', name: 'params', type: 'bytes' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
export default spaceAbi;
