'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('UserDrafts', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.TEXT, allowNull: true },
      body: { type: DataTypes.TEXT, allowNull: false },
      chain: { type: DataTypes.STRING, allowNull: true },
      community: { type: DataTypes.STRING, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('UserDrafts');
  }
};
