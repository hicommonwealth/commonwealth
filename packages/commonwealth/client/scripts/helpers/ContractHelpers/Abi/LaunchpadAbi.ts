export const LaunchpadAbi = [
  {
    inputs: [
      { internalType: 'address', name: '_defaultLPHook', type: 'address' },
      { internalType: 'address', name: '_protocolVault', type: 'address' },
      { internalType: 'uint256', name: '_protocolFee', type: 'uint256' },
      { internalType: 'address', name: '_curveManager', type: 'address' },
      { internalType: 'address', name: '_curveActionHook', type: 'address' },
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
        name: 'launchpad',
        type: 'address',
      },
    ],
    name: 'LaunchpadCreated',
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
    ],
    name: 'NewTokenCreated',
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
        name: 'curveId',
        type: 'uint256',
      },
    ],
    name: 'TokenRegistered',
    type: 'event',
  },
  {
    inputs: [],
    name: 'bondingCurve',
    outputs: [
      { internalType: 'contract LPBondingCurve', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'bondingCurveAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'curveActionHook',
    outputs: [
      { internalType: 'contract ICurveActionHook', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'defaultLPHook',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint256[]', name: 'shares', type: 'uint256[]' },
      { internalType: 'address[]', name: 'holders', type: 'address[]' },
      { internalType: 'uint256', name: 'totalSupply', type: 'uint256' },
      { internalType: 'uint256', name: 'curveId', type: 'uint256' },
      { internalType: 'uint256', name: 'scalar', type: 'uint256' },
      { internalType: 'address', name: 'LPhook', type: 'address' },
      { internalType: 'address', name: 'launchAction', type: 'address' },
    ],
    name: 'launchTokenWithLiquidity',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolVault',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];
