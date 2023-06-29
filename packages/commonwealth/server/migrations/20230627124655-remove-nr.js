'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Subscriptions', 'object_id', {
        transaction: t,
      });
      // extract user_id for user specific notifications (new-mention and new-collaboration)
      await queryInterface.addColumn(
        'Notifications',
        'user_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Notifications" N
        SET user_id = NR.user_id
        FROM "NotificationsRead" NR
        WHERE (N.category_id = 'new-mention' OR N.category_id = 'new-collaboration')
          AND NR.notification_id = N.id;
      `,
        { transaction: t }
      );

      await queryInterface.dropTable('NotificationsRead', { transaction: t });

      // delete all notifications older than 3 months -> ~55% of Notifications
      await queryInterface.sequelize.query(
        `
        DELETE FROM "Notifications"
        WHERE created_at < NOW() - interval '3 months';
      `,
        { transaction: t }
      );

      // delete all subscriptions for users that have not logged-in in the past year -> 53% of all Subscriptions
      await queryInterface.sequelize.query(
        `
        WITH delete_sub_ids AS (
          SELECT S.id
          FROM "Subscriptions" S
          INNER JOIN "Users" U ON U.id = S.subscriber_id
          WHERE U.updated_at < NOW() - interval '12 months'
        ) DELETE FROM "Subscriptions"
        WHERE id IN (SELECT id from delete_sub_ids) OR category_id = 'new-chat-mention';
      `,
        { transaction: t }
      );

      // extract parent_comment_id for new-comment-creation notifications
      await queryInterface.addColumn(
        'Notifications',
        'parent_comment_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Notifications" N
        SET parent_comment_id = (N.notification_data::jsonb ->> 'parent_comment_id')::INTEGER
        WHERE N.category_id = 'new-comment-creation' AND N.notification_data::jsonb ? 'parent_comment_id';
      `,
        { transaction: t }
      );

      // delete duplicate comment notifications - see #4345
      await queryInterface.sequelize.query(
        `
        WITH dup_comments as (SELECT (notification_data::jsonb ->> 'comment_id')::INTEGER as id
                      FROM "Notifications"
                      WHERE category_id = 'new-comment-creation'
                      GROUP BY (notification_data::jsonb ->> 'comment_id')::INTEGER
                      HAVING COUNT(*) > 1),
        dup_notif as (SELECT id
                      FROM "Notifications"
                      WHERE (notification_data::jsonb ->> 'comment_id')::INTEGER IN (SELECT id FROM dup_comments) AND category_id = 'new-comment-creation')
        DELETE FROM "Notifications"
        WHERE id IN (SELECT id FROM dup_notif) AND parent_comment_id IS NOT NULL;
      `,
        { transaction: t }
      );

      // extract comment_id for new-comment-creation child comment notifications
      // and for new-reaction notifications on comments
      await queryInterface.addColumn(
        'Notifications',
        'comment_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Notifications" N
        SET comment_id = (N.notification_data::jsonb ->> 'comment_id')::INTEGER
        WHERE (N.category_id = 'new-comment-creation' OR N.category_id = 'new-reaction') AND N.notification_data::jsonb ? 'comment_id';
      `,
        { transaction: t }
      );

      // extract space for snapshot-proposal notifications
      await queryInterface.addColumn(
        'Notifications',
        'snapshot_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Notifications" N
        SET snapshot_id = N.notification_data::jsonb ->> 'space'
        WHERE N.category_id = 'snapshot-proposal' AND N.notification_data::jsonb ? 'space';
      `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        CREATE INDEX notifications_chain_category
            ON "Notifications" (category_id, chain_id);
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        CREATE INDEX subscriptions_chain_category
            ON "Subscriptions" (category_id, chain_id);
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        CREATE INDEX notifications_comment_id
            ON "Notifications" (comment_id);
      `,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        CREATE INDEX subscriptions_subscriber_id
            ON "Subscriptions" (subscriber_id);
      `,
        { transaction: t }
      );

      await queryInterface.removeIndex(
        'Notifications',
        ['new_chain_event_id', 'Notifications_unique_chain_event_id'],
        {
          transaction: t,
        }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
