'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('InviteLinks', {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      community_id: { type: DataTypes.STRING, allowNull: false },
      creator_id: { type: DataTypes.INTEGER, allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      multi_use: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
      used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      time_limit: {
        type: DataTypes.ENUM,
        values: ['24h', '48h', '1w', '30d', 'none'],
        defaultValue: 'none',
        allowNull: false,
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, {
      underscored: true,
      indexes: [
        { fields: ['id'] },
      ],
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('InviteLinks');
  }
};
