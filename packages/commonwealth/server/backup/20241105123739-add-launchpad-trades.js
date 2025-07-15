'use strict';

const { hasher } = require('node-object-hash');

const LPBondingCurveABI = [
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
        name: 'tokenAddress',
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

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashInstance = hasher({
      coerce: true,
      sort: true,
      trim: true,
      alg: 'sha256',
      enc: 'hex',
    });
    const LPBondingCurveAbiHash = hashInstance.hash(LPBondingCurveABI);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'LaunchpadTrades',
        {
          eth_chain_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
          },
          transaction_hash: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true,
          },
          token_address: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
              model: 'Tokens',
              key: 'token_address',
            },
          },
          trader_address: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          is_buy: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          community_token_amount: {
            type: Sequelize.NUMERIC(78, 0),
            allowNull: false,
          },
          price: {
            type: Sequelize.NUMERIC(78, 0),
            allowNull: false,
          },
          floating_supply: {
            type: Sequelize.NUMERIC(78, 0),
            allowNull: false,
          },
          timestamp: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
        },
        { transaction },
      );
      await queryInterface.addIndex('LaunchpadTrades', ['token_address'], {
        transaction,
      });
      const contract = await queryInterface.sequelize.query(
        `
            INSERT INTO "ContractAbis" (abi, nickname, abi_hash, verified, created_at, updated_at)
            VALUES (:abi,
                    'LPBondingCurve',
                    :abi_hash,
                    true,
                    NOW(),
                    NOW()
                   ) RETURNING *;
        `,
        {
          replacements: {
            abi: JSON.stringify(LPBondingCurveABI),
            abi_hash: LPBondingCurveAbiHash,
          },
          transaction,
        },
      );

      // only add the event source for base-sepolia where the contract exists
      const node = await queryInterface.sequelize.query(
        `
        SELECT id FROM "ChainNodes"
        WHERE eth_chain_id = 84532;
    `,
        { transaction },
      );

      if (node[0].length === 0) {
        return;
      }

      await queryInterface.bulkInsert(
        'EvmEventSources',
        [
          {
            chain_node_id: node[0][0].id,
            contract_address: '0xaEA78B289A769DA4dde967262b5076ea8FE56607',
            event_signature:
              '0x9adcf0ad0cda63c4d50f26a48925cf6405df27d422a39c456b5f03f661c82982',
            kind: 'LaunchpadTrade',
            abi_id: contract[0][0].id,
          },
        ],
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('LaunchpadTrades', { transaction });
      await queryInterface.bulkDelete(
        'EvmEventSources',
        {
          event_signature:
            '0x9adcf0ad0cda63c4d50f26a48925cf6405df27d422a39c456b5f03f661c82982',
          contract_address: '0xaEA78B289A769DA4dde967262b5076ea8FE56607',
          kind: 'LaunchpadTrade',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'ContractAbis',
        {
          nickname: 'LPBondingCurve',
        },
        { transaction },
      );
    });
  },
};
