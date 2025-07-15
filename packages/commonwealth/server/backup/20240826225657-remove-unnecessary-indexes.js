'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'ThreadSubscriptions',
        'thread_subscriptions_user_id_thread_id',
        { transaction },
      );
      // flip from (thread_id, user_id) to (user_id, thread_id)
      await queryInterface.removeConstraint(
        'ThreadSubscriptions',
        'Threadsubscriptions_pkey',
        { transaction },
      );
      await queryInterface.addConstraint('ThreadSubscriptions', {
        type: 'primary key',
        fields: ['user_id', 'thread_id'],
        transaction,
      });

      await queryInterface.removeIndex(
        'CommentSubscriptions',
        'comment_subscriptions_user_id_comment_id',
        { transaction },
      );
      await queryInterface.removeConstraint(
        'CommentSubscriptions',
        'Commentsubscriptions_pkey',
        { transaction },
      );
      await queryInterface.addConstraint('CommentSubscriptions', {
        type: 'primary key',
        fields: ['user_id', 'comment_id'],
        transaction,
      });

      await queryInterface.removeIndex(
        'CommunityAlerts',
        'community_alerts_community_id',
        { transaction },
      );
      await queryInterface.removeIndex(
        'CommunityAlerts',
        'community_alerts_user_id_community_id',
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
