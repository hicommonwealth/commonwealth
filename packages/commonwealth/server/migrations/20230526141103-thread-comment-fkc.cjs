'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // Retrieve the count of comments with invalid thread_id
      const [ids, _] = await queryInterface.sequelize.query(
        `
        SELECT id
        FROM "Comments"
        WHERE thread_id NOT IN (
          SELECT id FROM "Threads"
        );
      `,
        { transaction: t }
      );

      if (ids.length > 0) {
        const commentIds = ids.map((c) => c.id);

        // Assert that the comment count is not more than 10 so that we don't end up deleting too many comments
        if (commentIds.length > 10) {
          throw new Error(
            'More than 10 comments found with invalid thread_id, fail-safe hit'
          );
        }

        const [reactionsToDelete, _2] = await queryInterface.sequelize.query(`
        SELECT *
        FROM "Reactions"
        WHERE comment_id IN (${commentIds.join(',')});
      `);

        // Assert that the reaction count is not more than 10 so that we don't end up deleting too many reactions
        if (reactionsToDelete.length > 10) {
          throw new Error(
            'More than 10 reactions found to delete, fail-safe hit'
          );
        }

        await queryInterface.bulkDelete(
          'Reactions',
          {
            id: reactionsToDelete.map((r) => r.id),
          },
          { transaction: t }
        );

        await queryInterface.bulkDelete(
          'Comments',
          {
            id: commentIds,
          },
          { transaction: t }
        );
      }

      await queryInterface.changeColumn(
        'Comments',
        'thread_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Threads',
            key: 'id',
          },
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Comments', 'thread_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
