export const lpBondingCurveAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_protocolFeeDestination',
        type: 'address',
        internalType: 'address',
      },
      { name: '_launchpad', type: 'address', internalType: 'address' },
      {
        name: '_protocolFeePercent',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: '_LPCurveManager', type: 'address', internalType: 'address' },
      {
        name: '_curveActionHook',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'LPCurveManager',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: '_getFloatingTokenSupply',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: '_getTotalTokenSupply',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: '_isFunded',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
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
    name: '_poolLiquidity',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'buyToken',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
      {
        name: 'minAmountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'curveActionHook',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract ICurveActionHook' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPrice',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'isBuy', type: 'bool', internalType: 'bool' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'launchpad',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'liquidity',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'protocolFeeDestination',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'protocolFeePercent',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'registerToken',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct LPBondingCurve.RegisterTokenParams',
        components: [
          { name: '_tokenAddress', type: 'address', internalType: 'address' },
          {
            name: '_curveId',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: '_scalar', type: 'uint256', internalType: 'uint256' },
          {
            name: '_reserveRatio',
            type: 'uint32',
            internalType: 'uint32',
          },
          { name: 'totalSupply', type: 'uint256', internalType: 'uint256' },
          {
            name: 'holders',
            type: 'address[]',
            internalType: 'address[]',
          },
          { name: 'shares', type: 'uint256[]', internalType: 'uint256[]' },
          {
            name: 'LPHook',
            type: 'address',
            internalType: 'address',
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'sellToken',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
      {
        name: 'amount',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'minAmountOut', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'tokens',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'launchpadLiquidity', type: 'uint256', internalType: 'uint256' },
      {
        name: 'poolLiquidity',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'curveId', type: 'uint256', internalType: 'uint256' },
      {
        name: 'scalar',
        type: 'uint256',
        internalType: 'uint256',
      },
      { name: 'reserveRatio', type: 'uint32', internalType: 'uint32' },
      {
        name: 'LPhook',
        type: 'address',
        internalType: 'address',
      },
      { name: 'funded', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferLiquidity',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
      {
        name: 'minAmountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'event',
    name: 'LiquidityTransferred',
    inputs: [
      {
        name: 'tokenAddress',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'LPHook',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'tokensTransferred',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'liquidityTransferred',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'TokenRegistered',
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
      {
        name: 'totalSupply',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Trade',
    inputs: [
      {
        name: 'trader',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'namespace',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'isBuy',
        type: 'bool',
        indexed: false,
        internalType: 'bool',
      },
      {
        name: 'communityTokenAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'ethAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'protocolEthAmount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'floatingSupply',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
    anonymous: false,
  },
];
