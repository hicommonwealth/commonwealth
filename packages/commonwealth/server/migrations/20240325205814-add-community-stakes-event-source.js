'use strict';

const { QueryTypes } = require('sequelize');

// DeployedNamespace event on factory contract
const event_signature =
  '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5';
const kind = 'DeployedNamespace';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
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
        });
      }

      if (blast.length > 0) {
        records.push({
          chain_node_id: blast[0].id,
          contract_address: '0xedf43C919f59900C82d963E99d822dA3F95575EA',
          event_signature,
          kind,
        });
      }

      if (sepoliaBase.length > 0) {
        records.push({
          chain_node_id: sepoliaBase[0].id,
          contract_address: '0xD8a357847cABA76133D5f2cB51317D3C74609710',
          event_signature,
          kind,
        });
      }

      if (sepolia.length > 0) {
        records.push({
          chain_node_id: sepolia[0].id,
          contract_address: '0xEAB6373E6a722EeC8A65Fd38b014d8B81d5Bc1d4',
          event_signature,
          kind,
        });
      }

      await queryInterface.bulkInsert('EvmEventSources', records, {
        transaction,
      });

      await queryInterface.addColumn(
        'EvmEventSources',
        'created_at_block',
        {
          type: Sequelize.DATE,
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
    });
  },
};
