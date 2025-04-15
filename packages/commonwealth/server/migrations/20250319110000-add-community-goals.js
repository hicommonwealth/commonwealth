'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'CommunityGoalMetas',
        {
          id: {
            type: 'INTEGER',
            autoIncrement: true,
            primaryKey: true,
          },
          name: {
            type: 'VARCHAR(255)',
            allowNull: false,
          },
          description: {
            type: 'VARCHAR(255)',
            allowNull: false,
          },
          type: {
            type: 'VARCHAR(255)',
            allowNull: false,
          },
          target: {
            type: 'INTEGER',
            allowNull: false,
          },
          created_at: {
            type: 'TIMESTAMP WITH TIME ZONE',
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'CommunityGoalReached',
        {
          community_goal_meta_id: {
            type: 'INTEGER',
            primaryKey: true,
            references: {
              model: 'CommunityGoalMetas',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          community_id: {
            type: 'VARCHAR(255)',
            primaryKey: true,
            references: {
              model: 'Communities',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          created_at: {
            type: 'TIMESTAMP WITH TIME ZONE',
            allowNull: false,
          },
          reached_at: {
            type: 'TIMESTAMP WITH TIME ZONE',
            allowNull: true,
          },
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('CommunityGoalReached', { transaction });
      await queryInterface.dropTable('CommunityGoalMetas', { transaction });
    });
  },
};
