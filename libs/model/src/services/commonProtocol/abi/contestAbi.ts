export const contestABI = [
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
        name: 'contentId',
        type: 'uint256',
        indexed: true,
      },
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
        indexed: true,
      },
      {
        internalType: 'string',
        name: 'url',
        type: 'string',
        indexed: false,
      },
    ],
    type: 'event',
    name: 'ContentAdded',
    anonymous: false,
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
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'voteContent',
  },
];
