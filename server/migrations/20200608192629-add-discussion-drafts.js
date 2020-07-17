'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('DiscussionDrafts', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      address_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Addresses', key: 'id' } },
      title: { type: DataTypes.TEXT, allowNull: true },
      body: { type: DataTypes.TEXT, allowNull: true },
      tag: { type: DataTypes.STRING, allowNull: true },
      chain: { type: DataTypes.STRING, allowNull: true },
      community: { type: DataTypes.STRING, allowNull: true },
      attachment: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'OffchainAttachments', key: 'id' } },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false }
    }, {
      underscored: true,
      indexes: [
        { fields: ['address_id'] },
      ],
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('DiscussionDrafts');
  }
};
