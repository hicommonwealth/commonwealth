'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
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

      await queryInterface.addIndex('Communities', ['token_created_at'], {
        name: 'communities_token_created_at_index',
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'Communities',
        'communities_token_created_at_index',
        { transaction },
      );

      await queryInterface.removeColumn('Communities', 'token_created_at', {
        transaction,
      });
    });
  },
};
