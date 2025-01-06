export const launchpadFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_defaultLPHook', type: 'address', internalType: 'address' },
      {
        name: '_protocolVault',
        type: 'address',
        internalType: 'address',
      },
      { name: '_protocolFee', type: 'uint256', internalType: 'uint256' },
      {
        name: '_curveManager',
        type: 'address',
        internalType: 'address',
      },
      { name: '_curveActionHook', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'bondingCurve',
    type: 'function',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract LPBondingCurve' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'bondingCurveAddress',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'curveActionHook',
    type: 'function',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract ICurveActionHook' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'defaultLPHook',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
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
  {
    name: 'protocolFee',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'protocolVault',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'LaunchpadCreated',
    type: 'event',
    inputs: [
      {
        name: 'launchpad',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    name: 'NewTokenCreated',
    type: 'event',
    inputs: [
      {
        name: 'token',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'totalSupply',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'name',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
      {
        name: 'symbol',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
    ],
    anonymous: false,
  },
  {
    name: 'TokenRegistered',
    type: 'event',
    inputs: [
      {
        name: 'token',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'curveId',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
];
