'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Sessions', {
      sid: { type: Sequelize.STRING, primaryKey: true },
      expires: Sequelize.DATE,
      data: Sequelize.TEXT,
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Sessions');
  },
};
