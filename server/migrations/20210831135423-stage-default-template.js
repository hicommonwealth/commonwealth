'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('OffchainStages', 'default_offchain_template', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainStages', 'default_offchain_template', { transaction: t });
    });
  }
};
