'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex('CommentSubscriptions', ['comment_id'], {
        name: 'comment_subscriptions_comment_id',
        transaction,
      });
      await queryInterface.addIndex('ThreadSubscriptions', ['thread_id'], {
        name: 'thread_subscriptions_thread_id',
        transaction,
      });
      await queryInterface.addIndex('CommunityAlerts', ['community_id'], {
        name: 'community_alerts_community_id',
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'CommentSubscriptions',
        'comment_subscriptions_comment_id',
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        'ThreadSubscriptions',
        'thread_subscriptions_thread_id',
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        'CommunityAlerts',
        'community_alerts_community_id',
        {
          transaction,
        },
      );
    });
  },
};
