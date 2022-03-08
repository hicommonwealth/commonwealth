/* eslint-disable quotes */
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const users = await queryInterface.sequelize.query(
        `SELECT * FROM "Users";`,
        { transaction: t }
      );
      await Promise.all(
        users[0].map(async (user) => {
          const resSubs = await queryInterface.sequelize.query(
            `SELECT * FROM "Subscriptions" WHERE subscriber_id=${user.id} AND category_id IN ('new-comment-creation', 'new-reaction');`,
            { transaction: t }
          );
          const subscriptions = resSubs[0];

          const orphanedCommentSubscriptions = [];
          while (subscriptions.length) {
            const subscription1 = subscriptions.splice(0, 1)[0];
            const subscription2 = subscriptions.findIndex(
              (s) => s.object_id === subscription1.object_id
            );
            if (subscription2 === -1) {
              orphanedCommentSubscriptions.push(subscription1);
            } else {
              subscriptions.splice(subscription2, 1);
            }
          }

          if (orphanedCommentSubscriptions.length === 0) return;
          await Promise.all(
            orphanedCommentSubscriptions.map(async (s) => {
              await queryInterface.sequelize.query(
                `INSERT INTO "Subscriptions" (subscriber_id, category_id, object_id, is_active, immediate_email, chain_id, community_id, offchain_thread_id, offchain_comment_id, created_at, updated_at) VALUES (${
                  user.id
                }, 'new-reaction', '${s.object_id}', ${s.is_active}, '${
                  s.immediate_email
                }', ${s.chain_id ? `'${s.chain_id}'` : 'NULL'}, ${
                  s.community_id ? `'${s.community_id}'` : 'NULL'
                }, ${s.offchain_thread_id || 'NULL'}, ${
                  s.offchain_comment_id || 'NULL'
                }, NOW(), NOW());`,
                { transaction: t }
              );
            })
          );
        })
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([]);
  },
};
