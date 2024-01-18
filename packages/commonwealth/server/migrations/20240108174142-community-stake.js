'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'CommunityStakes',
      {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        community_id: {
          type: Sequelize.STRING,
          references: {
            model: 'Communities',
            key: 'id',
          },
          allowNull: false,
        },
        stake_id: { type: Sequelize.INTEGER, allowNull: false },
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
        indexes: [{ fields: ['id'] }, { fields: ['community_id'] }],
      },
    );
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('CommunityStakes');
  },
};
