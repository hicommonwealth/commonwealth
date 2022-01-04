'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainThreads',
        'last_commented_on',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        {
          transaction: t
        }
      );
      const threadLastCommentedOn = {};
      const allComments = await queryInterface.sequelize.query(`SELECT root_id, created_at FROM "OffchainComments"`, {
        transaction: t
      });
      console.log(allComments[0][0]);
      allComments[0].forEach((comment) => {
        const discussionId = comment.root_id.split('_')[1];
        if (discussionId.includes('0x') || Number.isNaN(Number(discussionId))) return;
        if (!threadLastCommentedOn[discussionId] ||
          comment.created_at > threadLastCommentedOn[discussionId]) {
            threadLastCommentedOn[discussionId] = comment.created_at;
          }
      });
      console.log(threadLastCommentedOn[2413]);
      console.log(typeof threadLastCommentedOn[2413]);
      const ex = threadLastCommentedOn[2413];
      // throw Error();
      await Promise.all(Object.keys(threadLastCommentedOn).map(async (threadId) => {
        await queryInterface.sequelize.query(
          `UPDATE "OffchainThreads" SET last_commented_on=TO_TIMESTAMP(${(new Date(threadLastCommentedOn[threadId]).getTime() / 1000).toFixed(0)}) WHERE id=${threadId}`,
          { transaction: t }
        );
      }))
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainThreads', 'last_commented_on');
  }
};
