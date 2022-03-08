'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'DiscussionDrafts',
      {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        address_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Addresses', key: 'id' },
        },
        title: { type: Sequelize.TEXT, allowNull: true },
        body: { type: Sequelize.TEXT, allowNull: true },
        tag: { type: Sequelize.STRING, allowNull: true },
        chain: { type: Sequelize.STRING, allowNull: true },
        community: { type: Sequelize.STRING, allowNull: true },
        attachment: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'OffchainAttachments', key: 'id' },
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        underscored: true,
        indexes: [{ fields: ['address_id'] }],
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('DiscussionDrafts');
  },
};
