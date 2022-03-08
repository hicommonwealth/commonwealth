'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ChatMessages', {
      address: { type: Sequelize.STRING, allowNull: false },
      chain: { type: Sequelize.STRING, allowNull: false },
      text: { type: Sequelize.TEXT, allowNull: false },
      room: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ChatMessages');
  },
};
