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

    const node = queryInterface.sequelize.query(`
        SELECT id FROM "ChainNodes"
        WHERE id = 1399;
    `);

    if (!node) {
      return;
    }

    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.changeColumn(
        'Communities',
        'namespace',
        {
          type: Sequelize.STRING,
          allowNull: true,
          unique: true,
        },
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `
            ALTER TABLE "Tokens"
            ADD COLUMN token_address VARCHAR PRIMARY KEY,
            ADD COLUMN namespace VARCHAR,
            ADD CONSTRAINT fk_namespace FOREIGN KEY (namespace) REFERENCES "Communities"(namespace),
            ADD COLUMN initial_supply DECIMAL(78, 0),
            ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT false,
            DROP COLUMN chain_node_id,
            DROP COLUMN base,
            DROP COLUMN author_address,
            DROP COLUMN launchpad_contract_address,
            DROP COLUMN uniswap_pool_address,
            DROP CONSTRAINT "Tokens_pkey";
        `,
        { transaction: t },
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
