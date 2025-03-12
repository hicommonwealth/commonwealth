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

      await queryInterface.addColumn(
        'Communities',
        'token_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Communities',
        'token_created_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Communities', 'token_created_at', {
        transaction,
      });
      await queryInterface.removeColumn('Communities', 'token_address', {
        transaction,
      });
      await queryInterface.removeColumn('Communities', 'community_indexer_id', {
        transaction,
      });
    });
  },
};
