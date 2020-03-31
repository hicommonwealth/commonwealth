'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Roles', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
      address_id: { type: DataTypes.INTEGER, allowNull: false },
      offchain_community_id: { type: DataTypes.STRING, allowNull: false },
      permission: {
          type: DataTypes.ENUM,
          values: ['admin', 'moderator', 'member'],
          defaultValue: 'member',
          allowNull: false
        },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, {
      underscored: true,
      indexes: [
        { fields: ['address_id'] },
        { fields: ['offchain_community_id'] },
      ],
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('Roles');
  }
};
