'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'OffchainThreads',
        'snapshot_proposal',
        {
          type: Sequelize.STRING(48),
          allowNull: true,
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainThreads', 'snapshot_proposal');
  },
};
