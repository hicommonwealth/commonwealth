'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable('Events', 'StatsEvents', {
        transaction: t,
      });
      await queryInterface.renameTable('Balances', 'StatsBalances', {
        transaction: t,
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable('StatsEvents', 'Events', {
        transaction: t,
      });
      await queryInterface.renameTable('StatsBalances', 'Balances', {
        transaction: t,
      });
    });
  },
};
