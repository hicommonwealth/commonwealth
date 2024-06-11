'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const subscriptions = await queryInterface.sequelize.query(
        `SELECT * FROM "Subscriptions";`,
        { transaction: t }
      );
      const threads = await queryInterface.sequelize.query(
        `SELECT * FROM "OffchainThreads" WHERE deleted_at IS NULL;`,
        { transaction: t }
      );
      const threadIds = threads[0].map((t) => t.id);
      const comments = await queryInterface.sequelize.query(
        `SELECT * FROM "OffchainComments" WHERE deleted_at IS NULL;`,
        { transaction: t }
      );
      const commentIds = comments[0].map((c) => c.id);
      await Promise.all(
        subscriptions[0].map((s) => {
          if (
            s.category_id === 'new-comment-creation' ||
            s.category_id === 'new-reaction'
          ) {
            if (s.offchain_thread_id) {
              if (threadIds.includes(s.offchain_thread_id)) return;
              else {
                queryInterface.sequelize.query(
                  `DELETE FROM "Notifications" WHERE subscription_id=${s.id}; DELETE FROM "Subscriptions" WHERE id=${s.id};`,
                  { transaction: t }
                );
              }
            } else if (s.offchain_comment_id) {
              if (commentIds.includes(s.offchain_comment_id)) return;
              else {
                queryInterface.sequelize.query(
                  `DELETE FROM "Notifications" WHERE subscription_id=${s.id}; DELETE FROM "Subscriptions" WHERE id=${s.id};`,
                  { transaction: t }
                );
              }
            } else if (
              !s.offchain_comment_id &&
              !s.offchain_thread_id &&
              !s.chain_id &&
              !s.community_id
            ) {
              queryInterface.sequelize.query(
                `DELETE FROM "Notifications" WHERE subscription_id=${s.id}; DELETE FROM "Subscriptions" WHERE id=${s.id};`,
                { transaction: t }
              );
            }
          } else {
            return;
          }
        })
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return new Promise((resolve, reject) => resolve());
  },
};
