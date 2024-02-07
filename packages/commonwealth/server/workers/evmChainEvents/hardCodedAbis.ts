export const rawAaveAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'governanceStrategy',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'votingDelay',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'guardian',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: 'executors',
        type: 'address[]',
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
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'ExecutorAuthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'ExecutorUnauthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newStrategy',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorChange',
        type: 'address',
      },
    ],
    name: 'GovernanceStrategyChanged',
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
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ProposalCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'contract IExecutorWithTimelock',
        name: 'executor',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        indexed: false,
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        indexed: false,
        internalType: 'bool[]',
        name: 'withDelegatecalls',
        type: 'bool[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'strategy',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'ipfsHash',
        type: 'bytes32',
      },
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
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorExecution',
        type: 'address',
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
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'executionTime',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorQueueing',
        type: 'address',
      },
    ],
    name: 'ProposalQueued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'support',
        type: 'bool',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'votingPower',
        type: 'uint256',
      },
    ],
    name: 'VoteEmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newVotingDelay',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorChange',
        type: 'address',
      },
    ],
    name: 'VotingDelayChanged',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DOMAIN_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'NAME',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'VOTE_EMITTED_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: '__abdicate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'executors',
        type: 'address[]',
      },
    ],
    name: 'authorizeExecutors',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IExecutorWithTimelock',
        name: 'executor',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        internalType: 'bool[]',
        name: 'withDelegatecalls',
        type: 'bool[]',
      },
      {
        internalType: 'bytes32',
        name: 'ipfsHash',
        type: 'bytes32',
      },
    ],
    name: 'create',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGovernanceStrategy',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGuardian',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'getProposalById',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'creator',
            type: 'address',
          },
          {
            internalType: 'contract IExecutorWithTimelock',
            name: 'executor',
            type: 'address',
          },
          {
            internalType: 'address[]',
            name: 'targets',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'values',
            type: 'uint256[]',
          },
          {
            internalType: 'string[]',
            name: 'signatures',
            type: 'string[]',
          },
          {
            internalType: 'bytes[]',
            name: 'calldatas',
            type: 'bytes[]',
          },
          {
            internalType: 'bool[]',
            name: 'withDelegatecalls',
            type: 'bool[]',
          },
          {
            internalType: 'uint256',
            name: 'startBlock',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'endBlock',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'executionTime',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'forVotes',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'againstVotes',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'executed',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'canceled',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'strategy',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: 'ipfsHash',
            type: 'bytes32',
          },
        ],
        internalType: 'struct IAaveGovernanceV2.ProposalWithoutVotes',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'getProposalState',
    outputs: [
      {
        internalType: 'enum IAaveGovernanceV2.ProposalState',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getProposalsCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'address', name: 'voter', type: 'address' },
    ],
    name: 'getVoteOnProposal',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'support',
            type: 'bool',
          },
          {
            internalType: 'uint248',
            name: 'votingPower',
            type: 'uint248',
          },
        ],
        internalType: 'struct IAaveGovernanceV2.Vote',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getVotingDelay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'isExecutorAuthorized',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
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
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'queue',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [
      {
        internalType: 'address',
        name: 'governanceStrategy',
        type: 'address',
      },
    ],
    name: 'setGovernanceStrategy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'votingDelay',
        type: 'uint256',
      },
    ],
    name: 'setVotingDelay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'support', type: 'bool' },
    ],
    name: 'submitVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'support', type: 'bool' },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'submitVoteBySignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'executors',
        type: 'address[]',
      },
    ],
    name: 'unauthorizeExecutors',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export const rawCompoundAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'tribe',
        type: 'address',
        internalType: 'contract ERC20VotesComp',
      },
      {
        name: 'timelock',
        type: 'address',
        internalType: 'contract ICompoundTimelock',
      },
      { name: 'guardian', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'ProposalCanceled',
    type: 'event',
    inputs: [
      {
        name: 'proposalId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    name: 'ProposalCreated',
    type: 'event',
    inputs: [
      {
        name: 'proposalId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'proposer',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'targets',
        type: 'address[]',
        indexed: false,
        internalType: 'address[]',
      },
      {
        name: 'values',
        type: 'uint256[]',
        indexed: false,
        internalType: 'uint256[]',
      },
      {
        name: 'signatures',
        type: 'string[]',
        indexed: false,
        internalType: 'string[]',
      },
      {
        name: 'calldatas',
        type: 'bytes[]',
        indexed: false,
        internalType: 'bytes[]',
      },
      {
        name: 'startBlock',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'endBlock',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'description',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
    ],
    anonymous: false,
  },
  {
    name: 'ProposalExecuted',
    type: 'event',
    inputs: [
      {
        name: 'proposalId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    name: 'ProposalQueued',
    type: 'event',
    inputs: [
      {
        name: 'proposalId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'eta',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    name: 'ProposalThresholdUpdated',
    type: 'event',
    inputs: [
      {
        name: 'oldProposalThreshold',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'newProposalThreshold',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    name: 'QuorumUpdated',
    type: 'event',
    inputs: [
      {
        name: 'oldQuorum',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'newQuorum',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  { name: 'Rollback', type: 'event', inputs: [], anonymous: false },
  {
    name: 'RollbackQueued',
    type: 'event',
    inputs: [
      { name: 'eta', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    name: 'TimelockChange',
    type: 'event',
    inputs: [
      {
        name: 'oldTimelock',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'newTimelock',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    name: 'VoteCast',
    type: 'event',
    inputs: [
      {
        name: 'voter',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'proposalId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      { name: 'support', type: 'uint8', indexed: false, internalType: 'uint8' },
      {
        name: 'weight',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'reason',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
    ],
    anonymous: false,
  },
  {
    name: 'VotingDelayUpdated',
    type: 'event',
    inputs: [
      {
        name: 'oldVotingDelay',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'newVotingDelay',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    name: 'VotingPeriodUpdated',
    type: 'event',
    inputs: [
      {
        name: 'oldVotingPeriod',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'newVotingPeriod',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    name: 'BACKUP_GOVERNOR',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'BALLOT_TYPEHASH',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    name: 'COUNTING_MODE',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'pure',
  },
  {
    name: 'ROLLBACK_DEADLINE',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: '__acceptAdmin',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: '__executeRollback',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: '__rollback',
    type: 'function',
    inputs: [{ name: 'eta', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'cancel',
    type: 'function',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'castVote',
    type: 'function',
    inputs: [
      { name: 'proposalId', type: 'uint256', internalType: 'uint256' },
      {
        name: 'support',
        type: 'uint8',
        internalType: 'uint8',
      },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'castVoteBySig',
    type: 'function',
    inputs: [
      { name: 'proposalId', type: 'uint256', internalType: 'uint256' },
      {
        name: 'support',
        type: 'uint8',
        internalType: 'uint8',
      },
      { name: 'v', type: 'uint8', internalType: 'uint8' },
      {
        name: 'r',
        type: 'bytes32',
        internalType: 'bytes32',
      },
      { name: 's', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'castVoteWithReason',
    type: 'function',
    inputs: [
      { name: 'proposalId', type: 'uint256', internalType: 'uint256' },
      {
        name: 'support',
        type: 'uint8',
        internalType: 'uint8',
      },
      { name: 'reason', type: 'string', internalType: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'execute',
    type: 'function',
    inputs: [
      { name: 'targets', type: 'address[]', internalType: 'address[]' },
      {
        name: 'values',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      { name: 'calldatas', type: 'bytes[]', internalType: 'bytes[]' },
      {
        name: 'descriptionHash',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    name: 'execute',
    type: 'function',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'getActions',
    type: 'function',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'targets', type: 'address[]', internalType: 'address[]' },
      {
        name: 'values',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      { name: 'signatures', type: 'string[]', internalType: 'string[]' },
      {
        name: 'calldatas',
        type: 'bytes[]',
        internalType: 'bytes[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getReceipt',
    type: 'function',
    inputs: [
      { name: 'proposalId', type: 'uint256', internalType: 'uint256' },
      {
        name: 'voter',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'hasVoted', type: 'bool', internalType: 'bool' },
          {
            name: 'support',
            type: 'uint8',
            internalType: 'uint8',
          },
          { name: 'votes', type: 'uint96', internalType: 'uint96' },
        ],
        internalType: 'struct IGovernorCompatibilityBravo.Receipt',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getVotes',
    type: 'function',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      {
        name: 'blockNumber',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'hasVoted',
    type: 'function',
    inputs: [
      { name: 'proposalId', type: 'uint256', internalType: 'uint256' },
      {
        name: 'account',
        type: 'address',
        internalType: 'address',
      },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    name: 'hashProposal',
    type: 'function',
    inputs: [
      { name: 'targets', type: 'address[]', internalType: 'address[]' },
      {
        name: 'values',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      { name: 'calldatas', type: 'bytes[]', internalType: 'bytes[]' },
      {
        name: 'descriptionHash',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    name: 'proposalDeadline',
    type: 'function',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'proposalEta',
    type: 'function',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'proposalSnapshot',
    type: 'function',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'proposalThreshold',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'proposals',
    type: 'function',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256', internalType: 'uint256' },
      {
        name: 'proposer',
        type: 'address',
        internalType: 'address',
      },
      { name: 'eta', type: 'uint256', internalType: 'uint256' },
      {
        name: 'startBlock',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'endBlock', type: 'uint256', internalType: 'uint256' },
      {
        name: 'forVotes',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'againstVotes', type: 'uint256', internalType: 'uint256' },
      {
        name: 'abstainVotes',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'canceled', type: 'bool', internalType: 'bool' },
      {
        name: 'executed',
        type: 'bool',
        internalType: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'propose',
    type: 'function',
    inputs: [
      { name: 'targets', type: 'address[]', internalType: 'address[]' },
      {
        name: 'values',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      { name: 'calldatas', type: 'bytes[]', internalType: 'bytes[]' },
      {
        name: 'description',
        type: 'string',
        internalType: 'string',
      },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'propose',
    type: 'function',
    inputs: [
      { name: 'targets', type: 'address[]', internalType: 'address[]' },
      {
        name: 'values',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      { name: 'signatures', type: 'string[]', internalType: 'string[]' },
      {
        name: 'calldatas',
        type: 'bytes[]',
        internalType: 'bytes[]',
      },
      { name: 'description', type: 'string', internalType: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'queue',
    type: 'function',
    inputs: [
      { name: 'targets', type: 'address[]', internalType: 'address[]' },
      {
        name: 'values',
        type: 'uint256[]',
        internalType: 'uint256[]',
      },
      { name: 'calldatas', type: 'bytes[]', internalType: 'bytes[]' },
      {
        name: 'descriptionHash',
        type: 'bytes32',
        internalType: 'bytes32',
      },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'queue',
    type: 'function',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'quorum',
    type: 'function',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'quorumVotes',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'setProposalThreshold',
    type: 'function',
    inputs: [
      {
        name: 'newProposalThreshold',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'setQuorum',
    type: 'function',
    inputs: [{ name: 'newQuorum', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'setVotingDelay',
    type: 'function',
    inputs: [
      { name: 'newVotingDelay', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'setVotingPeriod',
    type: 'function',
    inputs: [
      { name: 'newVotingPeriod', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'state',
    type: 'function',
    inputs: [{ name: 'proposalId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: '', type: 'uint8', internalType: 'enum IGovernor.ProposalState' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'supportsInterface',
    type: 'function',
    inputs: [{ name: 'interfaceId', type: 'bytes4', internalType: 'bytes4' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    name: 'timelock',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'token',
    type: 'function',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract ERC20VotesComp' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'updateTimelock',
    type: 'function',
    inputs: [
      {
        name: 'newTimelock',
        type: 'address',
        internalType: 'contract ICompoundTimelock',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'version',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    name: 'votingDelay',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'votingPeriod',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
];

export const rawDydxAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'governanceStrategy',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'votingDelay',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'addExecutorAdmin',
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
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'ExecutorAuthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'ExecutorUnauthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newStrategy',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorChange',
        type: 'address',
      },
    ],
    name: 'GovernanceStrategyChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ProposalCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'contract IExecutorWithTimelock',
        name: 'executor',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        indexed: false,
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        indexed: false,
        internalType: 'bool[]',
        name: 'withDelegatecalls',
        type: 'bool[]',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endBlock',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'strategy',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'ipfsHash',
        type: 'bytes32',
      },
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
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorExecution',
        type: 'address',
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
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'executionTime',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorQueueing',
        type: 'address',
      },
    ],
    name: 'ProposalQueued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'previousAdminRole',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'newAdminRole',
        type: 'bytes32',
      },
    ],
    name: 'RoleAdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'support',
        type: 'bool',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'votingPower',
        type: 'uint256',
      },
    ],
    name: 'VoteEmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newVotingDelay',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initiatorChange',
        type: 'address',
      },
    ],
    name: 'VotingDelayChanged',
    type: 'event',
  },
  {
    inputs: [],
    name: 'ADD_EXECUTOR_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'DOMAIN_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'EIP712_DOMAIN_NAME',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'OWNER_ROLE',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'VOTE_EMITTED_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'executors',
        type: 'address[]',
      },
    ],
    name: 'authorizeExecutors',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IExecutorWithTimelock',
        name: 'executor',
        type: 'address',
      },
      {
        internalType: 'address[]',
        name: 'targets',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: 'values',
        type: 'uint256[]',
      },
      {
        internalType: 'string[]',
        name: 'signatures',
        type: 'string[]',
      },
      {
        internalType: 'bytes[]',
        name: 'calldatas',
        type: 'bytes[]',
      },
      {
        internalType: 'bool[]',
        name: 'withDelegatecalls',
        type: 'bool[]',
      },
      {
        internalType: 'bytes32',
        name: 'ipfsHash',
        type: 'bytes32',
      },
    ],
    name: 'create',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGovernanceStrategy',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'getProposalById',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'id',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'creator',
            type: 'address',
          },
          {
            internalType: 'contract IExecutorWithTimelock',
            name: 'executor',
            type: 'address',
          },
          {
            internalType: 'address[]',
            name: 'targets',
            type: 'address[]',
          },
          {
            internalType: 'uint256[]',
            name: 'values',
            type: 'uint256[]',
          },
          {
            internalType: 'string[]',
            name: 'signatures',
            type: 'string[]',
          },
          {
            internalType: 'bytes[]',
            name: 'calldatas',
            type: 'bytes[]',
          },
          {
            internalType: 'bool[]',
            name: 'withDelegatecalls',
            type: 'bool[]',
          },
          {
            internalType: 'uint256',
            name: 'startBlock',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'endBlock',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'executionTime',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'forVotes',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'againstVotes',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'executed',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'canceled',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'strategy',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: 'ipfsHash',
            type: 'bytes32',
          },
        ],
        internalType: 'struct IDydxGovernor.ProposalWithoutVotes',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'getProposalState',
    outputs: [
      {
        internalType: 'enum IDydxGovernor.ProposalState',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getProposalsCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'role', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'address', name: 'voter', type: 'address' },
    ],
    name: 'getVoteOnProposal',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'support',
            type: 'bool',
          },
          {
            internalType: 'uint248',
            name: 'votingPower',
            type: 'uint248',
          },
        ],
        internalType: 'struct IDydxGovernor.Vote',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getVotingDelay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'hasRole',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
    ],
    name: 'isExecutorAuthorized',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
    ],
    name: 'queue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'governanceStrategy',
        type: 'address',
      },
    ],
    name: 'setGovernanceStrategy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'votingDelay',
        type: 'uint256',
      },
    ],
    name: 'setVotingDelay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'support', type: 'bool' },
    ],
    name: 'submitVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      { internalType: 'bool', name: 'support', type: 'bool' },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'submitVoteBySignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'executors',
        type: 'address[]',
      },
    ],
    name: 'unauthorizeExecutors',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
