'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('UserDrafts', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      author_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Addresses', key: 'id' } },
      title: { type: DataTypes.TEXT, allowNull: true },
      body: { type: DataTypes.TEXT, allowNull: true },
      tag: { type: DataTypes.STRING, allowNull: true },
      chain: { type: DataTypes.STRING, allowNull: true },
      community: { type: DataTypes.STRING, allowNull: true },
      attachment: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'OffchainAttachment', key: 'id' } },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('UserDrafts');
  }
};
