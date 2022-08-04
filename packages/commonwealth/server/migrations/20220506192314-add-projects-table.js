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

        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });

      const ethChainNodeId = await queryInterface.rawSelect('Chains', {
        where: {
          id: 'ethereum'
        }
      }, ['chain_node_id']);

      // clone ethereum chain node to avoid revealing private url
      // const ethNode = await queryInterface.sequelize.query(`
      //   SELECT url, alt_wallet_url, private_url FROM "ChainNodes" WHERE id = ?
      // `, { transaction: t, replacements: [ethId] });
      //
      // const { url, alt_wallet_url, private_url } = ethNode[0][0];
      //
      // const result = await queryInterface.bulkInsert('ChainNodes', [{
      //   // chain: 'common-protocol',
      //   url,
      //   alt_wallet_url,
      //   private_url,
      //   eth_chain_id: 1,
      // }], { transaction: t });

      // create dummy CWP chain
      await queryInterface.bulkInsert('Chains', [{
        id: 'common-protocol',
        symbol: 'CWP',
        name: 'Common Protocol',
        type: 'token',
        network: 'common-protocol',
        base: 'ethereum',
        active: true,
        description: '',
        chain_node_id: ethChainNodeId
      }], { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('Projects', { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'common-protocol' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: 'common-protocol' }, { transaction: t });
    });
  }
};
