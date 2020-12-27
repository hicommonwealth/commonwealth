'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ArchivalNodeExecutionEntries', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      start_block: { type: Sequelize.INTEGER, unique: true},
      chain_event_version: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE },
      updated_at: { type: Sequelize.DATE }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ArchivalNodeExecutionEntries');
  }
};
