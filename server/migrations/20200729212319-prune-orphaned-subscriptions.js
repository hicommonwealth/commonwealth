
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const subscriptions = await queryInterface.sequelize.query(`SELECT * FROM "Subscriptions";`);
    console.dir(subscriptions[0].length);
    const threads = await queryInterface.sequelize.query(`SELECT * FROM "OffchainThreads" WHERE deleted_at IS NULL;`);
    const threadIds = threads[0].map((t) => t.id);
    console.dir(threads[0].length);
    console.dir(threadIds.length);
    const comments = await queryInterface.sequelize.query(`SELECT * FROM "OffchainComments" WHERE deleted_at IS NULL;`);
    const commentIds = comments[0].map((c) => c.id);
    console.dir(comments[0].length);
    await Promise.all(subscriptions[0].map((s) => {
      if (s.category_id === 'new-comment-creation' || s.category_id === 'new-reaction') {
        if (s.offchain_thread_id) {
          // console.dir(threadIds.includes(s.offchain_thread_id));
          if (threadIds.includes(s.offchain_thread_id)) return;
          else {
            console.dir(`DELETING SUBSCRIPTION #${s.id}`);
            queryInterface.sequelize.query(`DELETE FROM "Subscriptions" WHERE id=${s.id};`);
          }
        } else if (s.offchain_comment_id) {
          console.dir(commentIds.includes(s.offchain_comment_id));
          if (commentIds.includes(s.offchain_comment_id)) return;
          else {
            console.dir(`DELETING SUBSCRIPTION #${s.id}`);
            queryInterface.sequelize.query(`DELETE FROM "Subscriptions" WHERE id=${s.id};`);
          }
        }
      } else {
        return;
      }
    }));
  },

  down: (queryInterface, Sequelize) => {

  }
};
