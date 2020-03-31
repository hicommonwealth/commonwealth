'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    try {
      await queryInterface.createTable('OffchainAttachments', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        attachable: { type: DataTypes.STRING, allowNull: false },
        attachment_id: { type: DataTypes.INTEGER, allowNull: false },
        url: { type: DataTypes.TEXT, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: false },
      });
      await queryInterface.addIndex('OffchainAttachments', { fields: ['attachable', 'attachment_id'] });
      return new Promise((resolve, reject) => resolve());
    } catch (e) {
      return new Promise((resolve, reject) => reject(e));
    }
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('OffchainAttachments');
  }
};
