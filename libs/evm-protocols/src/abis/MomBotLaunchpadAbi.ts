export const MomBotLaunchpadAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_paymentToken', type: 'address', internalType: 'address' },
      { name: '_protocolVault', type: 'address', internalType: 'address' },
      { name: '_protocolFee', type: 'uint256', internalType: 'uint256' },
      { name: '_curveManager', type: 'address', internalType: 'address' },
      { name: '_curveActionHook', type: 'address', internalType: 'address' },
      { name: '_candidateManager', type: 'address', internalType: 'address' },
      { name: '_curveId', type: 'uint256', internalType: 'uint256' },
      { name: '_reserveRatio', type: 'uint32', internalType: 'uint32' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'CURVE_ID',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'RESERVE_RATIO',
    inputs: [],
    outputs: [{ name: '', type: 'uint32', internalType: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'bondingCurve',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract ERC20BondingCurve' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'candidateManager',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'launchToken',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'symbol', type: 'string', internalType: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'paymentToken',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
];
