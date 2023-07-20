'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Threads',
        'archived_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Threads', 'archived_at', {
        transaction
      });
    })
  }
};
