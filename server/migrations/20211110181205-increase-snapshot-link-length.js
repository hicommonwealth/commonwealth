'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('OffchainThreads', 'snapshot_proposal', {
      type: Sequelize.STRING(68),
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('OffchainThreads', 'snapshot_proposal', {
      type: Sequelize.STRING(68),
    });
  },
};
