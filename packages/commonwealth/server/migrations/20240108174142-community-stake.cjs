'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'CommunityStakes',
      {
        community_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: 'Communities',
            key: 'id',
          },
          allowNull: false,
        },
        stake_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
        },
        stake_token: { type: Sequelize.STRING, allowNull: false },
        stake_scaler: { type: Sequelize.NUMERIC, allowNull: false },
        stake_enabled: {
          type: Sequelize.BOOLEAN,
          default: false,
          allowNull: false,
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        indexes: [{ fields: ['community_id'] }, { fields: ['stake_id'] }],
      },
    );
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('CommunityStakes');
  },
};
