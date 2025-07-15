'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('IpfsPins', { transaction: t });

      // add projects columns
      await queryInterface.addColumn(
        'ChainEntityMeta',
        'type_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'ChainEntityMeta',
        'project_chain',
        {
          type: Sequelize.STRING,
          allowNull: true,
          references: { model: 'Chains', key: 'id' },
        },
        { transaction: t }
      );

      // Add required commonwealth nodes / chains
      const ethChainNode = await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            url: 'wss://eth-goerli.g.alchemy.com/v2/j4q_OFABLwfgV8b8Hel7JKLXH1y3G4_y',
            alt_wallet_url:
              'https://eth-goerli.g.alchemy.com/v2/j4q_OFABLwfgV8b8Hel7JKLXH1y3G4_y',
            eth_chain_id: 5,
            balance_type: 'ethereum',
            name: 'Ethereum (Goerli)',
          },
        ],
        { transaction: t, returning: true }
      );

      // create dummy CWP chain
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'common-protocol',
            default_symbol: 'CWP',
            name: 'Common Protocol',
            type: 'dao',
            network: 'common-protocol',
            base: 'ethereum',
            active: true,
            description: '',
            chain_node_id: ethChainNode[0].id,
          },
        ],
        { transaction: t }
      );

      const contract = await queryInterface.bulkInsert(
        'Contracts',
        [
          {
            address: '0x6f2b3594E54BAAcCB5A7AE93185e1A4fa82Ba67a',
            chain_node_id: ethChainNode[0].id,
            type: 'common-protocol',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction: t, returning: true }
      );

      await queryInterface.bulkInsert(
        'CommunityContracts',
        [
          {
            chain_id: 'common-protocol',
            contract_id: contract[0].id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction: t }
      );

      await queryInterface.addColumn(
        'Chains',
        'hide_projects',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'IpfsPins',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          address_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Addresses', key: 'id' },
          },
          ipfs_hash: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction: t }
      );

      await queryInterface.bulkDelete(
        'CommunityContracts',
        { chain_id: 'common-protocol' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Contracts',
        { address: '0x6f2b3594E54BAAcCB5A7AE93185e1A4fa82Ba67a' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'common-protocol' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { eth_chain_id: 5 },
        { transaction: t }
      );
      await queryInterface.removeColumn('ChainEntityMeta', 'type_id', {
        transaction: t,
      });
      await queryInterface.removeColumn('ChainEntityMeta', 'project_chain', {
        transaction: t,
      });
      await queryInterface.removeColumn('Chains', 'hide_projects', {
        transaction: t,
      });
    });
  },
};
