'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'InviteLinks',
      {
        id: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
        community_id: { type: Sequelize.STRING, allowNull: false },
        creator_id: { type: Sequelize.INTEGER, allowNull: false },
        active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        multi_use: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        used: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        time_limit: {
          type: Sequelize.ENUM,
          values: ['24h', '48h', '1w', '30d', 'none'],
          defaultValue: 'none',
          allowNull: false,
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        underscored: true,
        indexes: [{ fields: ['id'] }],
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('InviteLinks');
  },
};
