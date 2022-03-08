'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Events',
      {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        origin: { type: Sequelize.STRING, allowNull: false },
        blocknum: { type: Sequelize.INTEGER, allowNull: false },
        timestamp: { type: Sequelize.STRING, allowNull: true },
        name: { type: Sequelize.STRING, allowNull: false },
        data: { type: Sequelize.TEXT, allowNull: true },
      },
      {
        underscored: true,
        indexes: [
          { fields: ['origin', 'blocknum'] },
          { fields: ['origin', 'timestamp'] },
        ],
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Events');
  },
};
