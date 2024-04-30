'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('HedgehogUsers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      walletAddress: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('HedgehogUsers');
  },
};
