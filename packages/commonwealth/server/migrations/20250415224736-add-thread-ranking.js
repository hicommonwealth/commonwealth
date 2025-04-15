'use strict';

const Sequelize = require('sequelize');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'ThreadRanks',
        {
          thread_id: {
            primaryKey: true,
            type: Sequelize.INTEGER,
            references: {
              model: 'Threads',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          rank: { type: Sequelize.BIGINT, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Threads',
        'user_tier_at_creation',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Comments',
        'user_tier_at_creation',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Reactions',
        'user_tier_at_creation',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
