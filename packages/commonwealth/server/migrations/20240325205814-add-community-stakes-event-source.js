'use strict';

const { QueryTypes } = require('sequelize');
const { hasher } = require('node-object-hash');

// DeployedNamespace event on factory contract
const event_signature =
  '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5';
const kind = 'DeployedNamespace';

const namespaceFactoryAbi = [
  { inputs: [], name: 'InvalidInitialization', type: 'error' },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      {
        indexed: false,
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'ConfiguredCommunityStakeId',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      {
        indexed: false,
        internalType: 'address',
        name: '_feeManager',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: '_signature',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'address',
        name: '_namespaceDeployer',
        type: 'address',
      },
    ],
    name: 'DeployedNamespace',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    inputs: [],
    name: 'CurveManager',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'communityStake',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      {
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      {
        internalType: 'address',
        name: 'exchangeToken',
        type: 'address',
      },
      { internalType: 'uint256', name: 'scalar', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'curve',
        type: 'uint256',
      },
    ],
    name: 'configureCommunityStakeId',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      {
        internalType: 'string',
        name: '_uri',
        type: 'string',
      },
      { internalType: 'address', name: '_feeManager', type: 'address' },
      {
        internalType: 'bytes',
        name: '_signature',
        type: 'bytes',
      },
    ],
    name: 'deployNamespace',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'getNamespace',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_communityStake',
        type: 'address',
      },
      { internalType: 'address', name: '_namespaceLogic', type: 'address' },
      {
        internalType: 'address',
        name: '_reservationHook',
        type: 'address',
      },
      { internalType: 'address', name: '_curveManager', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'namespaceLogic',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      { internalType: 'uint256', name: '', type: 'uint256' },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reservationHook',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_hook', type: 'address' }],
    name: 'setReservationHook',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'newImplementation', type: 'address' },
    ],
    name: 'updateNamespaceImplementation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const hashInstance = hasher({
  coerce: true,
  sort: true,
  trim: true,
  alg: 'sha256',
  enc: 'hex',
});
const abi_hash = hashInstance.hash(namespaceFactoryAbi);

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Outbox', 'id', 'event_id', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Outbox"
        ALTER COLUMN event_id SET NOT NULL;
      `,
        { transaction },
      );

      // link EvmEventSources to an abi directly (bypass Contracts table)
      await queryInterface.addColumn(
        'EvmEventSources',
        'abi_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'ContractAbis',
            key: 'id',
          },
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        WITH CTE AS (
            SELECT ESS.id, CA.id as abi_id
            FROM "EvmEventSources" ESS
            JOIN "Contracts" C ON C.address = ESS.contract_address AND C.chain_node_id = ESS.chain_node_id
            JOIN "ContractAbis" CA ON CA.id = C.abi_id
        )
        UPDATE "EvmEventSources"
        SET abi_id = CTE.abi_id
        FROM CTE
        WHERE "EvmEventSources".id = CTE.id;
      `,
        { transaction },
      );

      // upload NamespaceFactory contract ABI
      const abi_id = (
        await queryInterface.sequelize.query(
          `
        INSERT INTO "ContractAbis" (abi, verified, created_at, updated_at, nickname, abi_hash)
        VALUES (
            :abi,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            :nickname,
            :abi_hash
        ) RETURNING id;
      `,
          {
            transaction,
            raw: true,
            type: QueryTypes.INSERT,
            replacements: {
              abi: JSON.stringify(namespaceFactoryAbi),
              nickname: 'NamespaceFactory',
              abi_hash,
            },
          },
        )
      )[0][0].id;

      const base = await queryInterface.sequelize.query(
        `
        SELECT id
        FROM "ChainNodes"
        WHERE eth_chain_id = 8453;
      `,
        { transaction, raw: true, type: QueryTypes.SELECT },
      );

      const blast = await queryInterface.sequelize.query(
        `
        SELECT id
        FROM "ChainNodes"
        WHERE eth_chain_id = 81457;
      `,
        { transaction, raw: true, type: QueryTypes.SELECT },
      );

      const sepoliaBase = await queryInterface.sequelize.query(
        `
        SELECT id
        FROM "ChainNodes"
        WHERE eth_chain_id = 84532;
      `,
        { transaction, raw: true, type: QueryTypes.SELECT },
      );

      const sepolia = await queryInterface.sequelize.query(
        `
        SELECT id
        FROM "ChainNodes"
        WHERE eth_chain_id = 11155111;
      `,
        { transaction, raw: true, type: QueryTypes.SELECT },
      );

      const records = [];

      if (base.length > 0) {
        records.push({
          chain_node_id: base[0].id,
          contract_address: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
          event_signature,
          kind,
          abi_id,
        });
      }

      if (blast.length > 0) {
        records.push({
          chain_node_id: blast[0].id,
          contract_address: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
          event_signature,
          kind,
          abi_id,
        });
      }

      if (sepoliaBase.length > 0) {
        records.push({
          chain_node_id: sepoliaBase[0].id,
          contract_address: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
          event_signature,
          kind,
          abi_id,
        });
      }

      if (sepolia.length > 0) {
        records.push({
          chain_node_id: sepolia[0].id,
          contract_address: '0xEAB6373E6a722EeC8A65Fd38b014d8B81d5Bc1d4',
          event_signature,
          kind,
          abi_id,
        });
      }

      await queryInterface.bulkInsert('EvmEventSources', records, {
        transaction,
      });

      await queryInterface.addColumn(
        'EvmEventSources',
        'created_at_block',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'EvmEventSources',
        'events_migrated',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'EvmEventSources',
        'active',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'EvmEventSources',
        {
          event_signature,
          kind,
        },
        { transaction },
      );

      await queryInterface.removeColumn('EvmEventSources', 'created_at_block', {
        transaction,
      });
      await queryInterface.removeColumn('EvmEventSources', 'events_migrated', {
        transaction,
      });
      await queryInterface.removeColumn('EvmEventSources', 'active', {
        transaction,
      });
      await queryInterface.removeColumn('EvmEventSources', 'abi_id', {
        transaction,
      });

      await queryInterface.bulkDelete(
        'ContractAbis',
        {
          abi_hash,
        },
        { transaction },
      );
    });
  },
};
