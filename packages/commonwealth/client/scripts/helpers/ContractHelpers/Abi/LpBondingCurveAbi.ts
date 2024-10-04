export const LpBondingCurve = [
  {
    inputs: [
      { internalType: 'address', name: 'tokenAddress', type: 'address' },
    ],
    stateMutability: 'payable',
    type: 'function',
    name: 'buyToken',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
  },
  {
    inputs: [
      { internalType: 'address', name: 'tokenAddress', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
    name: 'sellToken',
  },
  {
    type: 'function',
    name: 'getPrice',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
      { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
      { name: 'isBuy', type: 'bool', internalType: 'bool' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    inputs: [
      { internalType: 'address', name: 'tokenAddress', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
    name: '_getFloatingTokenSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
    name: 'liquidity',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: '_launchpadLiquidity',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferLiquidity',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
];
