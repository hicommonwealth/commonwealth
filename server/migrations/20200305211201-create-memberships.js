'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Memberships', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      chain: { type: DataTypes.STRING, allowNull: true },
      community: { type: DataTypes.STRING, allowNull: true },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Memberships');
  }
};
