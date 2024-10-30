export const LaunchpadFactory = [
  {
    type: 'function',
    name: 'launchTokenWithLiquidity',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'symbol', type: 'string', internalType: 'string' },
      { name: 'shares', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'holders', type: 'address[]', internalType: 'address[]' },
      { name: 'totalSupply', type: 'uint256', internalType: 'uint256' },
      { name: 'curveId', type: 'uint256', internalType: 'uint256' },
      { name: 'scalar', type: 'uint256', internalType: 'uint256' },
      { name: 'lphook', type: 'address', internalType: 'address' },
      { name: 'launchAction', type: 'address', internalType: 'address' },
      { name: 'connectorWeight', type: 'uint32', internalType: 'uint32' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
];
