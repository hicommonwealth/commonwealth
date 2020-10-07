'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Proposals');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Proposals', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      chain: { type: Sequelize.STRING, allowNull: false },
      identifier: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      data: { type: Sequelize.JSON, allowNull: false },
      completed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      final_state: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: Sequelize.DATE,
    });
  }
};
