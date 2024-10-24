export const ContestAbi = [
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
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    name: 'winnerIds',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
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
    inputs: [],
    stateMutability: 'view',
    type: 'function',
    name: 'endTime',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
  },
  {
    inputs: [],
    stateMutability: 'view',
    type: 'function',
    name: 'startTime',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
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
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
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
    name: 'newContest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'endContest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
