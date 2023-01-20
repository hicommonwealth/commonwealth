'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('WaitlistRegistrations');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('WaitlistRegistrations', {
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      chain_id: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
};
