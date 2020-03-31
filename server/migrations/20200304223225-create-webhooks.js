'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Webhooks', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      url: { type: DataTypes.STRING, allowNull: false },
      chain_id: { type: DataTypes.STRING, allowNull: true },
      offchain_community_id: { type: DataTypes.STRING, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, {
      underscored: true,
      indexes: [
        { fields: ['name'] },
        { fields: ['chain_id'] },
        { fields: ['offchain_community_id'] },
      ],
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('Webhooks');
  }
};
