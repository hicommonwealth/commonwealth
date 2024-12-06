'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Tokens', 'LaunchpadTokens', {
        transaction,
      });
      await queryInterface.createTable('PinnedTokens', {
        contract_address: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        community_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: 'Communities',
            key: 'id',
          },
        },
        chain_node_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'ChainNodes',
            key: 'id',
          },
        },
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('LaunchpadTokens', 'Tokens', {
        transaction,
      });
      await queryInterface.dropTable('PinnedTokens');
    });
  },
};
