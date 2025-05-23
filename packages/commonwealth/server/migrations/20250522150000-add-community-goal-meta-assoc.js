'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'QuestActionMetas',
      'community_goal_meta_id',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'CommunityGoalMetas',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    );
  },

  async down() {},
};
