'use strict';

const { hasher } = require('node-object-hash');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const namespaceAbi = [
      {
        type: 'constructor',
        inputs: [
          { name: '_defaultLPHook', type: 'address', internalType: 'address' },
          { name: '_protocolVault', type: 'address', internalType: 'address' },
          { name: '_protocolFee', type: 'uint256', internalType: 'uint256' },
          { name: '_curveManager', type: 'address', internalType: 'address' },
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
        name: 'bondingCurve',
        inputs: [],
        outputs: [
          {
            name: '',
            type: 'address',
            internalType: 'contract LPBondingCurve',
          },
        ],
        stateMutability: 'view',
      },
      {
        type: 'function',
        name: 'bondingCurveAddress',
        inputs: [],
        outputs: [{ name: '', type: 'address', internalType: 'address' }],
        stateMutability: 'view',
      },
      {
        type: 'function',
        name: 'curveActionHook',
        inputs: [],
        outputs: [
          {
            name: '',
            type: 'address',
            internalType: 'contract ICurveActionHook',
          },
        ],
        stateMutability: 'view',
      },
      {
        type: 'function',
        name: 'defaultLPHook',
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
        ],
        outputs: [],
        stateMutability: 'payable',
      },
      {
        type: 'function',
        name: 'protocolFee',
        inputs: [],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view',
      },
      {
        type: 'function',
        name: 'protocolVault',
        inputs: [],
        outputs: [{ name: '', type: 'address', internalType: 'address' }],
        stateMutability: 'view',
      },
      {
        type: 'event',
        name: 'LaunchpadCreated',
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
        type: 'event',
        name: 'NewTokenCreated',
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
        ],
        anonymous: false,
      },
    ];
    const hashInstance = hasher({
      coerce: true,
      sort: true,
      trim: true,
      alg: 'sha256',
      enc: 'hex',
    });
    const launchpadHash = hashInstance.hash(namespaceAbi);

    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('Tokens', { transaction: t });
      await queryInterface.changeColumn(
        'Communities',
        'namespace',
        {
          type: Sequelize.STRING, // up to 78 digits with no decimal places
          allowNull: true,
          unique: true,
        },
        { transaction: t },
      );
      await queryInterface.createTable(
        'Tokens',
        {
          // derived from event
          token_address: { type: Sequelize.STRING, primaryKey: true },
          namespace: {
            type: Sequelize.STRING,
            references: {
              model: 'Communities',
              key: 'namespace',
            },
          },
          name: { type: Sequelize.STRING },
          symbol: { type: Sequelize.STRING },
          initial_supply: { type: Sequelize.DECIMAL(78, 0) },

          // platform related
          description: { type: Sequelize.STRING, allowNull: true },
          icon_url: { type: Sequelize.STRING, allowNull: true },
          is_locked: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          timestamps: true,
          transactions: t,
        },
      );
      const contract = await queryInterface.sequelize.query(
        `
            INSERT INTO "ContractAbis" (abi, nickname, abi_hash, verified, created_at, updated_at)
            VALUES (:abi,
                    'Launchpad',
                    :abi_hash,
                    true,
                    NOW(),
                    NOW()
                   ) RETURNING *;
        `,
        {
          replacements: {
            abi: JSON.stringify(namespaceAbi),
            abi_hash: launchpadHash,
          },
          transaction: t,
        },
      );

      await queryInterface.bulkInsert(
        'EvmEventSources',
        [
          {
            chain_node_id: 1399,
            contract_address: '0x6b118c6efa258903939ed981e6f644330effebab',
            event_signature:
              '0xd7ca5dc2f8c6bb37c3a4de2a81499b25f8ca8bbb3082010244fe747077d0f6cc',
            kind: 'TokenLaunched',
            abi_id: contract[0][0].id,
          },
        ],
        { transaction: t },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
