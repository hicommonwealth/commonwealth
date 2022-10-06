'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('Projects', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        chain_id: {
          type: Sequelize.STRING,
          allowNull: true,
          references: { model: 'Chains', key: 'id' }
        },
        entity_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'ChainEntities', key: 'id' }
        },
        creator: { type: Sequelize.STRING, allowNull: false, },
        ipfs_hash_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'IpfsPins', key: 'id' }
        },

        beneficiary: { type: Sequelize.STRING, allowNull: false, },
        token: { type: Sequelize.STRING, allowNull: false, },
        curator_fee: { type: Sequelize.STRING, allowNull: false, },
        threshold: { type: Sequelize.STRING, allowNull: false, },
        deadline: { type: Sequelize.INTEGER, allowNull: false, },
        funding_amount: { type: Sequelize.STRING, allowNull: false, },

        title: { type: Sequelize.STRING(64), allowNull: true },
        short_description: { type: Sequelize.STRING(224), allowNull: true },
        description: { type: Sequelize.TEXT, allowNull: true },
        cover_image: { type: Sequelize.TEXT, allowNull: true },

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });

      const ethChainNode = await queryInterface.bulkInsert('ChainNodes', [{
        url: 'wss://eth-goerli.g.alchemy.com/v2/j4q_OFABLwfgV8b8Hel7JKLXH1y3G4_y',
        alt_wallet_url: 'https://eth-goerli.g.alchemy.com/v2/j4q_OFABLwfgV8b8Hel7JKLXH1y3G4_y',
        eth_chain_id: 5,
        balance_type: 'ethereum',
        chain_base: 'ethereum',
      }], { transaction: t, returning: true });

      // create dummy CWP chain
      await queryInterface.bulkInsert('Chains', [{
        id: 'common-protocol',
        default_symbol: 'CWP',
        name: 'Common Protocol',
        type: 'token',
        network: 'common-protocol',
        base: 'ethereum',
        active: true,
        description: '',
        chain_node_id: ethChainNode[0].id,
      }], { transaction: t });

      const contract = await queryInterface.bulkInsert('Contracts', [{
        address: '0x6f2b3594E54BAAcCB5A7AE93185e1A4fa82Ba67a',
        chain_node_id: ethChainNode[0].id,
        type: 'common-protocol',
        created_at: new Date(),
        updated_at: new Date(),
      }], { transaction: t, returning: true });

      await queryInterface.bulkInsert('CommunityContracts', [{
        chain_id: 'common-protocol',
        contract_id: contract[0].id,
        created_at: new Date(),
        updated_at: new Date(),
      }], { transaction: t });

      await queryInterface.addColumn('IpfsPins', 'user_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      }, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('IpfsPins', 'user_id', { transaction: t });
      await queryInterface.bulkDelete('CommunityContracts', { chain_id: 'common-protocol' }, { transaction: t });
      await queryInterface.bulkDelete(
        'Contracts',
        { address: '0x6f2b3594E54BAAcCB5A7AE93185e1A4fa82Ba67a' },
        { transaction: t },
      );
      await queryInterface.bulkDelete('Chains', { id: 'common-protocol' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { eth_chain_id: 5 }, { transaction: t });
      await queryInterface.dropTable('Projects', { transaction: t });
    });
  }
};
