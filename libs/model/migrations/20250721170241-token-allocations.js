'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // TODO: check DOUBLE precision vs NUMERIC

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
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          num_comments: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          comment_score: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          num_reactions: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          reactions_score: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          unadjusted_score: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          adjusted_score: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          percent_score: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          token_allocation: {
            type: Sequelize.DOUBLE,
            allowNull: false,
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
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          token_allocation: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
        },
        { transaction },
      );

      // Separate table without fkey to Addresses so users/addresses can
      // be deleted independently
      await queryInterface.createTable('ClaimAddresses', {
        user_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
        address: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Addresses', 'is_airdrop_claim_address');
  },
};
