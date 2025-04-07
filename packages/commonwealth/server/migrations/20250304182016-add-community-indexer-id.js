'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Communities',
        'community_indexer_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Communities', 'community_indexer_id', {
        transaction,
      });
    });
  },
};
