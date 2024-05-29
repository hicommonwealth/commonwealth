'use strict';

const { QueryTypes } = require('sequelize');
const { hasher } = require('node-object-hash');

const namespaceFactoryAbi = [
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
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
        indexed: false,
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'ConfiguredCommunityStakeId',
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
    ],
    name: 'DeployedNamespace',
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
    name: 'communityStake',
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
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'exchangeToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'scalar',
        type: 'uint256',
      },
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
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_uri',
        type: 'string',
      },
      {
        internalType: 'address',
        name: '_feeManager',
        type: 'address',
      },
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
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'getNamespace',
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
        internalType: 'address',
        name: '_communityStake',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_namespaceLogic',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_reservationHook',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_curveManager',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'namespaceLogic',
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
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'interval',
        type: 'uint256',
      },
      {
        internalType: 'uint256[]',
        name: 'winnerShares',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'prizeShare',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'voterShare',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'feeShare',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'weight',
        type: 'uint256',
      },
    ],
    name: 'newContest',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'length',
        type: 'uint256',
      },
      {
        internalType: 'uint256[]',
        name: 'winnerShares',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'voterShare',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'weight',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'exhangeToken',
        type: 'address',
      },
    ],
    name: 'newSingleContest',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [
      {
        internalType: 'bytes4',
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    name: 'onERC1155Received',
    outputs: [
      {
        internalType: 'bytes4',
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_namespaceVotingStrategy',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_contestFactoryUtil',
        type: 'address',
      },
    ],
    name: 'reinitialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reservationHook',
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
        internalType: 'address',
        name: '_hook',
        type: 'address',
      },
    ],
    name: 'setReservationHook',
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
        internalType: 'address',
        name: 'newUtil',
        type: 'address',
      },
    ],
    name: 'updateContestUtilImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
    ],
    name: 'updateNamespaceImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const recurringContestAbi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: '_startTime',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: '_contestInterval',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: '_votingStrategy',
            type: 'address',
          },
          {
            internalType: 'address',
            name: '_claimHookAddress',
            type: 'address',
          },
          {
            internalType: 'address',
            name: '_contentHookAddress',
            type: 'address',
          },
          {
            internalType: 'uint256[]',
            name: '_winnerShares',
            type: 'uint256[]',
          },
          {
            internalType: 'address',
            name: '_contestToken',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: '_prizeShare',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: '_voterShare',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: '_namespace',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: '_protocolFeePercentage',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: '_protocolFeeDestination',
            type: 'address',
          },
        ],
        internalType: 'struct ContestGovernor.InitializationParams',
        name: 'initParams',
        type: 'tuple',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'contentId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'url',
        type: 'string',
      },
    ],
    name: 'ContentAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'contestId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startTime',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endTime',
        type: 'uint256',
      },
    ],
    name: 'NewRecurringContestStarted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newPrizeShare',
        type: 'uint256',
      },
    ],
    name: 'PrizeShareUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'contentId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'contestId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'votingPower',
        type: 'uint256',
      },
    ],
    name: 'VoterVoted',
    type: 'event',
  },
  {
    inputs: [],
    name: 'FeeMangerAddress',
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
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'url',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'addContent',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_contestId',
        type: 'uint256',
      },
    ],
    name: 'claimContentRewards',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimHook',
    outputs: [
      {
        internalType: 'contract IContestGovernorClaimHook',
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
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
    ],
    name: 'claimVoterRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'completedContests',
    outputs: [
      {
        internalType: 'bool',
        name: 'claimed',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'totalPrize',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'content',
    outputs: [
      {
        internalType: 'string',
        name: 'url',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'cumulativeVotes',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'completed',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contentHook',
    outputs: [
      {
        internalType: 'contract IContestGovernorContentHook',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contestId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contestInterval',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contestToken',
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
    name: 'currMinWinVotes',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentContentId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'endTime',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'contestId',
        type: 'uint256',
      },
    ],
    name: 'getPastWinners',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getWinnerIds',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'namespace',
    outputs: [
      {
        internalType: 'contract INamespace',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'newContest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextPrizeShare',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'prizeShare',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFeeDestination',
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
    name: 'protocolFeePercentage',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'startTime',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'newShare',
        type: 'uint256',
      },
    ],
    name: 'updatePrizeShare',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'voteContent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'voterShare',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingStrategy',
    outputs: [
      {
        internalType: 'contract IVotingStrategy',
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
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'winnerIds',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
];

const singleContestAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_contestLength',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '_votingStrategy',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_claimHookAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_contentHookAddress',
        type: 'address',
      },
      {
        internalType: 'uint256[]',
        name: '_winnerShares',
        type: 'uint256[]',
      },
      {
        internalType: 'address',
        name: '_contestToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_voterShare',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '_namespace',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_protocolFeePercentage',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '_protocolFeeDestination',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'contentId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'url',
        type: 'string',
      },
    ],
    name: 'ContentAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'startTime',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'endTime',
        type: 'uint256',
      },
    ],
    name: 'NewSingleContestStarted',
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
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'TokenSwept',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'contentId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'votingPower',
        type: 'uint256',
      },
    ],
    name: 'VoterVoted',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'url',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'addContent',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimContentRewards',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimHook',
    outputs: [
      {
        internalType: 'contract IContestGovernorClaimHook',
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
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
    ],
    name: 'claimVoterRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'content',
    outputs: [
      {
        internalType: 'string',
        name: 'url',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'cumulativeVotes',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'completed',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contentHook',
    outputs: [
      {
        internalType: 'contract IContestGovernorContentHook',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contestEnded',
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
    name: 'contestLength',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contestStarted',
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
    name: 'contestToken',
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
    name: 'currMinWinVotes',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'currentContentId',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'endContest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'endTime',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'namespace',
    outputs: [
      {
        internalType: 'contract INamespace',
        name: '',
        type: 'address',
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
    name: 'protocolFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFeeDestination',
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
    name: 'protocolFeePercentage',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
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
    inputs: [],
    name: 'startTime',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
    ],
    name: 'sweepTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalPrize',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
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
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'voteContent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'voterShare',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingStrategy',
    outputs: [
      {
        internalType: 'contract IVotingStrategy',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
];

const hashInstance = hasher({
  coerce: true,
  sort: true,
  trim: true,
  alg: 'sha256',
  enc: 'hex',
});

const namespaceFactoryHash = hashInstance.hash(namespaceFactoryAbi);
const recurringContestHash = hashInstance.hash(recurringContestAbi);
const singleContestHash = hashInstance.hash(singleContestAbi);

async function uploadABIs(queryInterface, transaction) {
  const namespaceFactoryAbiId = (
    await queryInterface.sequelize.query(
      `
        INSERT INTO "ContractAbis" (abi, verified, created_at, updated_at, nickname, abi_hash)
        VALUES (
            :abi,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            :nickname,
            :abi_hash
        ) RETURNING id;
      `,
      {
        transaction,
        raw: true,
        type: QueryTypes.INSERT,
        replacements: {
          abi: JSON.stringify(namespaceFactoryAbi),
          nickname: 'NamespaceFactoryForContests',
          abi_hash: namespaceFactoryHash,
        },
      },
    )
  )[0][0].id;

  const recurringContestAbiId = (
    await queryInterface.sequelize.query(
      `
        INSERT INTO "ContractAbis" (abi, verified, created_at, updated_at, nickname, abi_hash)
        VALUES (
            :abi,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            :nickname,
            :abi_hash
        ) RETURNING id;
      `,
      {
        transaction,
        raw: true,
        type: QueryTypes.INSERT,
        replacements: {
          abi: JSON.stringify(recurringContestAbi),
          nickname: 'RecurringContest',
          abi_hash: recurringContestHash,
        },
      },
    )
  )[0][0].id;

  const singleContestAbiId = (
    await queryInterface.sequelize.query(
      `
        INSERT INTO "ContractAbis" (abi, verified, created_at, updated_at, nickname, abi_hash)
        VALUES (
            :abi,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            :nickname,
            :abi_hash
        ) RETURNING id;
      `,
      {
        transaction,
        raw: true,
        type: QueryTypes.INSERT,
        replacements: {
          abi: JSON.stringify(singleContestAbi),
          nickname: 'SingleContest',
          abi_hash: singleContestHash,
        },
      },
    )
  )[0][0].id;

  return {
    namespaceFactoryAbiId,
    recurringContestAbiId,
    singleContestAbiId,
  };
}

async function getChainNodeId(chainId, queryInterface, transaction) {
  const chainNode = await queryInterface.sequelize.query(
    `
        SELECT id
        FROM "ChainNodes"
        WHERE eth_chain_id = :chain_id;
      `,
    {
      transaction,
      raw: true,
      type: QueryTypes.SELECT,
      replacements: {
        chain_id: chainId,
      },
    },
  );
  return chainNode[0]?.id;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // insert namespace factory ABI with NewContest event + Contest ABI
      const { namespaceFactoryAbiId } = await uploadABIs(
        queryInterface,
        transaction,
      );

      const chainInfo = {
        Sepolia: {
          factory: '0xEAB6373E6a722EeC8A65Fd38b014d8B81d5Bc1d4',
          chainId: 11155111,
        },
        SepoliaBase: {
          factory: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
          chainId: 84532,
        },
        Blast: {
          factory: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
          chainId: 81457,
        },
        Base: {
          factory: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
          chainId: 8453,
        },
      };

      // insert event source for NamespaceFactory->NewContest event
      const records = [];

      for (const chainName of Object.keys(chainInfo)) {
        const { factory, chainId } = chainInfo[chainName];
        const chainNodeId = await getChainNodeId(
          chainId,
          queryInterface,
          transaction,
        );
        if (chainNodeId) {
          records.push({
            chain_node_id: chainNodeId,
            contract_address: factory,
            event_signature:
              '0x990f533044dbc89b838acde9cd2c72c400999871cf8f792d731edcae15ead693',
            kind: 'NewContest',
            abi_id: namespaceFactoryAbiId,
          });
        }
      }

      await queryInterface.bulkInsert('EvmEventSources', records, {
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'EvmEventSources',
        {
          kind: ['NewContest'],
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'ContractAbis',
        {
          abi_hash: [
            namespaceFactoryHash,
            recurringContestHash,
            singleContestHash,
          ],
        },
        { transaction },
      );
    });
  },
};
