'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Roles',
      {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        address_id: { type: Sequelize.INTEGER, allowNull: false },
        offchain_community_id: { type: Sequelize.STRING, allowNull: false },
        permission: {
          type: Sequelize.ENUM,
          values: ['admin', 'moderator', 'member'],
          defaultValue: 'member',
          allowNull: false,
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        underscored: true,
        indexes: [
          { fields: ['address_id'] },
          { fields: ['offchain_community_id'] },
        ],
      }
    );
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('Roles');
  },
};
