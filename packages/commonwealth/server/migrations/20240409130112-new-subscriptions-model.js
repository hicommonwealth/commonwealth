'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // write a query that deletes subscriptions whose thread_id does not match an id from the "Threads" table

      console.log('Starting...');
      await queryInterface.createTable(
        'SubscriptionPreferences',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'cascade',
          },
          email_notifications_enabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          digest_email_enabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          recap_email_enabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          mobile_push_notifications_enabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          mobile_push_discussion_activity_enabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          mobile_push_admin_alerts_enabled: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction, logging: console.log },
      );
      await queryInterface.addIndex('SubscriptionPreferences', ['user_id'], {
        unique: true,
        transaction,
      });

      await queryInterface.sequelize.query(
        `
            INSERT INTO "SubscriptionPreferences"(user_id)
            SELECT U.id
            FROM "Users" U;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
            WITH users_with_enabled_emails AS (
              SELECT subscriber_id
              FROM "Subscriptions"
              WHERE immediate_email = true
              GROUP BY subscriber_id
            )
            UPDATE "SubscriptionPreferences" 
            SET email_notifications_enabled = true, 
                digest_email_enabled = true
            FROM users_with_enabled_emails 
            WHERE "SubscriptionPreferences".user_id = users_with_enabled_emails.subscriber_id;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          CREATE OR REPLACE FUNCTION insert_subscription_preference()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM "SubscriptionPreferences" WHERE user_id = NEW.id
            ) THEN
              INSERT INTO "SubscriptionPreferences" (user_id)
              VALUES (NEW.id);
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          CREATE TRIGGER insert_subscription_preference_trigger
          AFTER INSERT ON "Users"
          FOR EACH ROW
          EXECUTE PROCEDURE insert_subscription_preference();
        `,
        { transaction },
      );

      /**
       * Thread Subscriptions (subscribe to root level comments)
       */
      await queryInterface.createTable(
        'ThreadSubscriptions',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'cascade',
          },
          thread_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Threads', key: 'id' },
            onDelete: 'cascade',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
      await queryInterface.addIndex(
        'ThreadSubscriptions',
        ['user_id', 'thread_id'],
        { unique: true, transaction },
      );

      console.log('Thread Subscriptions started');
      await queryInterface.sequelize.query(
        `
            WITH deleted_thread_subs AS (
                SELECT S.id
                FROM "Subscriptions" S
                         LEFT JOIN "Threads" T ON T.id = S.thread_id
                WHERE S.thread_id IS NOT NULL
                  AND T.id IS NULL
                  AND category_id = 'new-comment-creation'
            )
            INSERT INTO "ThreadSubscriptions" (user_id, thread_id)
            SELECT subscriber_id, thread_id
            FROM "Subscriptions" S
                     LEFT JOIN deleted_thread_subs DTS ON DTS.id = S.id
            WHERE S.category_id = 'new-comment-creation' AND S.thread_id IS NOT NULL AND DTS.id IS NULL
            GROUP BY subscriber_id, thread_id;
        `,
        { transaction },
      );
      console.log('Thread Subscriptions done');

      /**
       * Comment Subscriptions (subscribe to comments)
       */
      await queryInterface.createTable(
        'CommentSubscriptions',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'cascade',
          },
          comment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Comments', key: 'id' },
            onDelete: 'cascade',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
      await queryInterface.addIndex(
        'CommentSubscriptions',
        ['user_id', 'comment_id'],
        { unique: true, transaction },
      );

      console.log('Comment Subscriptions started');
      await queryInterface.sequelize.query(
        `
            WITH deleted_comment_subs AS (
                SELECT S.id
                FROM "Subscriptions" S
                         LEFT JOIN "Comments" T ON T.id = S.comment_id
                WHERE S.comment_id IS NOT NULL
                  AND T.id IS NULL
                  AND category_id = 'new-comment-creation'
            )
            INSERT INTO "CommentSubscriptions" (user_id, comment_id)
            SELECT subscriber_id, comment_id
            FROM "Subscriptions" S
                     LEFT JOIN deleted_comment_subs DCS ON DCS.id = S.id
            WHERE S.category_id = 'new-comment-creation' AND S.comment_id IS NOT NULL AND DCS.id IS NULL
            GROUP BY subscriber_id, comment_id;
        `,
        { transaction },
      );
      console.log('Comment Subscriptions done');

      /**
       * Community Alerts (subscribed to chain-events and snapshot proposals)
       */
      await queryInterface.createTable(
        'CommunityAlerts',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'cascade',
          },
          community_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'Communities', key: 'id' },
            onDelete: 'cascade',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
      await queryInterface.addIndex(
        'CommunityAlerts',
        ['user_id', 'community_id'],
        {
          unique: true,
          transaction,
        },
      );

      console.log('Community Alerts started');
      await queryInterface.sequelize.query(
        `
            INSERT INTO "CommunityAlerts" (user_id, community_id)
            SELECT S.subscriber_id, COALESCE(S.community_id, CSS.community_id)
            FROM "Subscriptions" S
            LEFT JOIN "CommunitySnapshotSpaces" CSS ON CSS.snapshot_space_id = S.snapshot_id
            WHERE category_id IN ('chain-event', 'snapshot-proposal') AND COALESCE(S.community_id, CSS.community_id) IS NOT NULL
            GROUP BY subscriber_id, COALESCE(S.community_id, CSS.community_id);
        `,
        { transaction },
      );
      console.log('Community Alerts done');

      /**
       * Triggers for Thread/Comment Subscriptions and Community Alerts
       */
      await queryInterface.sequelize.query(
        `
          CREATE OR REPLACE FUNCTION old_subscriptions_delete()
          RETURNS TRIGGER AS $$
          BEGIN
            IF OLD.category_id IN ('chain-event', 'snapshot-proposal') THEN
              DELETE FROM "CommunityAlerts"
              WHERE user_id = OLD.subscriber_id
                AND community_id = OLD.community_id;
            ELSIF OLD.category_id = 'new-comment-creation' AND OLD.comment_id IS NOT NULL THEN
              DELETE FROM "CommentSubscriptions"
              WHERE user_id = OLD.subscriber_id
                AND comment_id = OLD.comment_id;
            ELSIF OLD.category_id = 'new-comment-creation' AND OLD.thread_id IS NOT NULL THEN
              DELETE FROM "ThreadSubscriptions"
              WHERE user_id = OLD.subscriber_id
                AND thread_id = OLD.thread_id;
            END IF;
            RETURN OLD;
          END;
          $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );
      console.log('old_subscriptions_delete function created');

      await queryInterface.sequelize.query(
        `
          CREATE TRIGGER old_subscriptions_delete_trigger
          AFTER DELETE ON "Subscriptions"
          FOR EACH ROW
          EXECUTE FUNCTION old_subscriptions_delete();
        `,
        { transaction },
      );
      console.log('old_subscriptions_delete trigger created');

      await queryInterface.sequelize.query(
        `
          CREATE OR REPLACE FUNCTION old_subscriptions_insert()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.category_id IN ('chain-event', 'snapshot-proposal') THEN
              IF NOT EXISTS (
                SELECT 1 FROM "CommunityAlerts"
                WHERE user_id = NEW.subscriber_id
                  AND community_id = NEW.community_id
              ) THEN
                INSERT INTO "CommunityAlerts" (user_id, community_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.community_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            ELSIF NEW.category_id = 'new-comment-creation' AND NEW.comment_id IS NOT NULL THEN
              IF NOT EXISTS (
                SELECT 1 FROM "CommentSubscriptions"
                WHERE user_id = NEW.subscriber_id
                  AND comment_id = NEW.comment_id
              ) THEN
                INSERT INTO "CommentSubscriptions" (user_id, comment_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.comment_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            ELSIF NEW.category_id = 'new-comment-creation' AND NEW.thread_id IS NOT NULL THEN
              IF NOT EXISTS (
                SELECT 1 FROM "ThreadSubscriptions"
                WHERE user_id = NEW.subscriber_id
                  AND thread_id = NEW.thread_id
              ) THEN
                INSERT INTO "ThreadSubscriptions" (user_id, thread_id, created_at, updated_at)
                VALUES (NEW.subscriber_id, NEW.thread_id, NEW.created_at, NEW.updated_at);
              END IF;
              RETURN NEW;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );
      console.log('old_subscriptions_insert function created');

      await queryInterface.sequelize.query(
        `
          CREATE TRIGGER old_subscriptions_insert_trigger
          AFTER INSERT ON "Subscriptions"
          FOR EACH ROW
          EXECUTE FUNCTION old_subscriptions_insert();
        `,
        { transaction },
      );
      console.log('old_subscriptions_insert trigger created');

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER deactivating_subscription_trigger
        AFTER UPDATE ON "Subscriptions"
        FOR EACH ROW
        WHEN (NEW.is_active = false AND OLD.is_active = true)
        EXECUTE FUNCTION old_subscriptions_delete();
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER activating_subscription_trigger
        AFTER UPDATE ON "Subscriptions"
        FOR EACH ROW
        WHEN (NEW.is_active = true AND OLD.is_active = false)
        EXECUTE FUNCTION old_subscriptions_insert();
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // drop triggers
      await queryInterface.sequelize.query(
        `
        DROP TRIGGER IF EXISTS insert_subscription_preference_trigger ON "Users";
        DROP TRIGGER IF EXISTS old_subscriptions_delete_trigger ON "Subscriptions";
        DROP TRIGGER IF EXISTS old_subscriptions_insert_trigger ON "Subscriptions";
        DROP TRIGGER IF EXISTS deactivating_subscription_trigger ON "Subscriptions";
        DROP TRIGGER IF EXISTS activating_subscription_trigger ON "Subscriptions";
      `,
        { transaction },
      );

      // drop functions
      await queryInterface.sequelize.query(
        `
        DROP FUNCTION IF EXISTS insert_subscription_preference();
        DROP FUNCTION IF EXISTS old_subscriptions_delete();
        DROP FUNCTION IF EXISTS old_subscriptions_insert();
      `,
        { transaction },
      );

      // drop tables
      await queryInterface.dropTable('SubscriptionPreferences', {
        transaction,
      });
      await queryInterface.dropTable('ThreadSubscriptions', { transaction });
      await queryInterface.dropTable('CommentSubscriptions', { transaction });
      await queryInterface.dropTable('CommunityAlerts', {
        transaction,
      });
    });
  },
};
