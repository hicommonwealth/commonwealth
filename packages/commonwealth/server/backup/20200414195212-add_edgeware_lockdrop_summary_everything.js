'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'EdgewareLockdropEverythings',
      {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        createdAt: { type: Sequelize.DATE },
        data: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        underscored: true,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('EdgewareLockdropEverythings');
  },
};
