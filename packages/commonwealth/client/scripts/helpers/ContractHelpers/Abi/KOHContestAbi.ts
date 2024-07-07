export const KOHContestAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'buyAmount',
        type: 'uint256',
      },
    ],
    name: 'recordBuy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'sellAmount',
        type: 'uint256',
      },
    ],
    name: 'recordSell',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
