'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Webhooks',
      {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        url: { type: Sequelize.STRING, allowNull: false },
        chain_id: { type: Sequelize.STRING, allowNull: true },
        offchain_community_id: { type: Sequelize.STRING, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        underscored: true,
        indexes: [
          { fields: ['name'] },
          { fields: ['chain_id'] },
          { fields: ['offchain_community_id'] },
        ],
      }
    );
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('Webhooks');
  },
};
