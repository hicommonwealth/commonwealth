'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'HistoricalAllocations',
        {
          user_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
          },
          num_threads: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          thread_score: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          num_comments: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          comment_score: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          num_reactions: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          reactions_score: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          unadjusted_score: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          adjusted_score: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          percent_score: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          token_allocation: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          magna_synced_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'AuraAllocations',
        {
          user_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
          },
          total_xp: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          percent_allocation: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
          token_allocation: {
            type: Sequelize.DECIMAL,
            allowNull: false,
          },
        },
        { transaction },
      );

      // Separate table without fkey to Addresses so users/addresses can
      // be deleted independently
      await queryInterface.createTable(
        'ClaimAddresses',
        {
          user_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
          },
          address: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('ClaimAddresses');
      await queryInterface.dropTable('AuraAllocations');
      await queryInterface.dropTable('HistoricalAllocations');
    });
  },
};
