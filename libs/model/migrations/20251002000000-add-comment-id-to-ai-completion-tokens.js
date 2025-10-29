'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add comment_id column to AICompletionTokens table
      await queryInterface.addColumn(
        'AICompletionTokens',
        'comment_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Comments',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        { transaction },
      );

      // Create index on comment_id for efficient lookups
      await queryInterface.addIndex('AICompletionTokens', ['comment_id'], {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove index first
      await queryInterface.removeIndex('AICompletionTokens', ['comment_id'], {
        transaction,
      });

      // Remove column
      await queryInterface.removeColumn('AICompletionTokens', 'comment_id', {
        transaction,
      });
    });
  },
};
