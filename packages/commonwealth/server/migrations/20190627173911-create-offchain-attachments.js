'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.createTable('OffchainAttachments', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        attachable: { type: Sequelize.STRING, allowNull: false },
        attachment_id: { type: Sequelize.INTEGER, allowNull: false },
        url: { type: Sequelize.TEXT, allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      });
      await queryInterface.addIndex('OffchainAttachments', {
        fields: ['attachable', 'attachment_id'],
      });
      return new Promise((resolve, reject) => resolve());
    } catch (e) {
      return new Promise((resolve, reject) => reject(e));
    }
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('OffchainAttachments');
  },
};
