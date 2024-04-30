'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'OffchainViewCounts',
      {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        chain: { type: Sequelize.STRING },
        community: { type: Sequelize.STRING },
        object_id: { type: Sequelize.INTEGER, allowNull: false },
        view_count: { type: Sequelize.INTEGER, allowNull: false },
      },
      {
        underscored: true,
        timestamps: false,
        indexes: [
          { fields: ['id'] },
          { fields: ['chain', 'object_id'] },
          { fields: ['community', 'object_id'] },
          { fields: ['chain', 'community', 'object_id'] },
          { fields: ['view_count'] },
        ],
      }
    );
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('OffchainViewCounts');
  },
};
