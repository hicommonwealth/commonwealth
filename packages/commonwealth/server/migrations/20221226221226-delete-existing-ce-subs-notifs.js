'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      ///////// Notifications and NotificationsRead

      // create relevant indexes
      await queryInterface.sequelize.query(
        `
          CREATE INDEX idx_notifications_read_notification_id ON "NotificationsRead" (notification_id);
      `,
        { transaction: t, raw: true }
      );
      await queryInterface.sequelize.query(
        `
          CREATE INDEX idx_notifications_category_id ON "Notifications" (category_id);
      `,
        { transaction: t, raw: true }
      );
      await queryInterface.sequelize.query(
        `
          CREATE INDEX idx_subscriptions_category_id ON "Subscriptions" (category_id);
      `,
        { transaction: t, raw: true }
      );

      console.log('Indexes created');

      // delete notification reads that are associated with chain-event notifications
      await queryInterface.sequelize.query(
        `
          DELETE FROM "NotificationsRead" nr
              USING "Notifications" n
          WHERE nr.notification_id = n.id AND n.category_id = 'chain-event';
      `,
        {
          transaction: t,
          raw: true,
          type: queryInterface.sequelize.QueryTypes.DELETE,
        }
      );
      console.log('NR deleted');

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications" RENAME TO "OldNotifications";
      `,
        { transaction: t, raw: true }
      );

      console.log('Notifications table renamed');

      await queryInterface.sequelize.query(
        `
          CREATE TABLE "Notifications" AS
          SELECT *
          FROM "OldNotifications"
          WHERE category_id <> 'chain-event';
      `,
        { transaction: t, raw: true }
      );
      console.log('New notifications table created');

      // rename + recreate Notifications category_id fkey
      await queryInterface.sequelize.query(`
        ALTER TABLE "OldNotifications"
        RENAME CONSTRAINT "Notifications_category_id_fkey" TO "OldNotifications_category_id_fkey"
      `, { transaction: t, raw: true });
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications"
              ADD CONSTRAINT "Notifications_category_id_fkey"
                  FOREIGN KEY (category_id) REFERENCES "NotificationCategories"(name);
      `,
        { transaction: t, raw: true }
      );
      console.log('category key added');

      // rename + recreate chain_id fkey
      await queryInterface.sequelize.query(`
          ALTER TABLE "OldNotifications"
              RENAME CONSTRAINT "Notifications_chain_id_fkey" TO "OldNotifications_chain_id_fkey"
      `, { transaction: t, raw: true });
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications"
              ADD CONSTRAINT "Notifications_chain_id_fkey"
                  FOREIGN KEY (chain_id) REFERENCES "Chains"(id);
      `,
        { transaction: t, raw: true }
      );
      console.log('chain key added');

      // rename + recreate Notifications pkey
      await queryInterface.sequelize.query(`
          ALTER TABLE "OldNotifications"
              RENAME CONSTRAINT "Notifications_pkey1" TO "OldNotifications_pkey1"
      `, { transaction: t, raw: true });
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications"
              ADD CONSTRAINT "Notifications_pkey1" PRIMARY KEY (id);
      `,
        { transaction: t, raw: true }
      );
      console.log('primary key added');

      // rename + recreate Notifications sequence
      await queryInterface.sequelize.query(`
        ALTER SEQUENCE "Notifications_id_seq1" RENAME TO "OldNotifications_id_seq1";
      `, { transaction: t, raw: true });
      await queryInterface.sequelize.query(
        `
          CREATE SEQUENCE "Notifications_id_seq1";
      `,
        { transaction: t, raw: true }
      );
      console.log('Sequence created');
      await queryInterface.sequelize.query(
        `
        SELECT setval('"Notifications_id_seq1"', (SELECT MAX(id) FROM "Notifications"));
      `,
        { transaction: t, raw: true }
      );
      console.log('Sequence set');
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications"
              ALTER COLUMN id SET DEFAULT nextval('"Notifications_id_seq1"');
      `,
        { transaction: t, raw: true }
      );
      console.log('Sequence default');

      // rename + recreate Notifications chain_event_id unique constraint
      await queryInterface.sequelize.query(`
          ALTER TABLE "OldNotifications"
              RENAME CONSTRAINT "Notifications_unique_chain_event_id" TO "OldNotifications_unique_chain_event_id"
      `, { transaction: t, raw: true });
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications"
              ADD CONSTRAINT "Notifications_unique_chain_event_id" UNIQUE (chain_event_id);
      `,
        { transaction: t, raw: true }
      );
      console.log('Added unique constraint');

      // rename + recreate Notifications new_chain_event_id index
      await queryInterface.sequelize.query(`
          ALTER INDEX new_chain_event_id RENAME TO old_new_chain_event_id;
      `, { transaction: t, raw: true });
      await queryInterface.sequelize.query(
        `
            CREATE INDEX new_chain_event_id ON "Notifications" (chain_event_id);
        `,
        { transaction: t, raw: true }
      );
      console.log('Added new_chain_event_id index');

      ///////////////////// Subscriptions /////////////////////////////////////

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Subscriptions" RENAME TO "OldSubscriptions";
      `,
        { transaction: t, raw: true }
      );
      console.log('Subscriptions table renamed');

      await queryInterface.sequelize.query(
        `
          CREATE TABLE "Subscriptions" AS
          SELECT *
          FROM "OldSubscriptions"
          WHERE category_id <> 'chain-event';
      `,
        { transaction: t, raw: true }
      );
      console.log('New subscriptions table created');


      // rename + recreate category_id fkey
      await queryInterface.sequelize.query(`
          ALTER TABLE "OldSubscriptions"
              RENAME CONSTRAINT "Subscriptions_category_id_fkey" TO "OldSubscriptions_category_id_fkey";
      `, {transaction: t, raw: true});
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Subscriptions"
              ADD CONSTRAINT "Subscriptions_category_id_fkey"
                  FOREIGN KEY (category_id) REFERENCES "NotificationCategories"(name);
      `,
        { transaction: t, raw: true }
      );
      console.log('category key added');

      // rename + recreate subscriber_id
      await queryInterface.sequelize.query(`
          ALTER TABLE "OldSubscriptions"
              RENAME CONSTRAINT "Subscriptions_subscriber_id_fkey" TO "OldSubscriptions_subscriber_id_fkey";
      `, {transaction: t, raw: true});
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Subscriptions"
              ADD CONSTRAINT "Subscriptions_subscriber_id_fkey"
                  FOREIGN KEY (subscriber_id) REFERENCES "Users"(id);
      `,
        { transaction: t, raw: true }
      );
      console.log('subscriber id key added');

      // rename + recreate Subscriptions pkey
      await queryInterface.sequelize.query(`
          ALTER TABLE "OldSubscriptions"
              RENAME CONSTRAINT "Subscriptions_pkey" TO "OldSubscriptions_pkey";
      `, {transaction: t, raw: true});
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Subscriptions"
              ADD CONSTRAINT "Subscriptions_pkey" PRIMARY KEY (id);
      `,
        { transaction: t, raw: true }
      );
      console.log('primary key added');

      // rename + recreate subscription id sequence
      await queryInterface.sequelize.query(`
        ALTER SEQUENCE "Subscriptions_id_seq" RENAME TO "OldSubscriptions_id_seq";
      `, { transaction: t, raw: true });
      await queryInterface.sequelize.query(
        `
          CREATE SEQUENCE "Subscriptions_id_seq";
      `,
        { transaction: t, raw: true }
      );
      console.log('Sequence created');
      await queryInterface.sequelize.query(
        `
        SELECT setval('"Subscriptions_id_seq"', (SELECT MAX(id) FROM "Subscriptions"));
      `,
        { transaction: t, raw: true }
      );
      console.log('Sequence set');
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Subscriptions"
              ALTER COLUMN id SET DEFAULT nextval('"Subscriptions_id_seq"');
      `,
        { transaction: t, raw: true }
      );
      console.log('Sequence default');

      // rename + recreate subscriptions offchain_thread_id index
      await queryInterface.sequelize.query(`
          ALTER INDEX subscriptions_offchain_thread_id RENAME TO old_subscriptions_offchain_thread_id;
      `, { transaction: t, raw: true });
      await queryInterface.sequelize.query(
        `
          CREATE INDEX subscriptions_offchain_thread_id ON "Subscriptions" (offchain_thread_id);
      `,
        { transaction: t, raw: true }
      );

      ////////////////// Notifications Read ////////////////////////////////

      // duplicate notification_id column into old_notification_id
      await queryInterface.sequelize.query(`
          ALTER TABLE "NotificationsRead"
              RENAME COLUMN notification_id TO old_notification_id;
      `, { transaction: t, raw: true });
      await queryInterface.addColumn('NotificationsRead', 'notification_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, {transaction: t});
      await queryInterface.sequelize.query(`
          UPDATE "NotificationsRead"
          SET notification_id = old_notification_id;
      `, {transaction: t, raw: true});

      // rename + recreate notification_id fkey
      await queryInterface.sequelize.query(`
        ALTER TABLE "NotificationsRead"
        RENAME CONSTRAINT "NotificationsRead_notification_id_fkey" TO "OldNotificationsRead_notification_id_fkey";
      `, {transaction: t, raw: true});
      await queryInterface.sequelize.query(
        `
            ALTER TABLE "NotificationsRead"
                ADD CONSTRAINT "NotificationsRead_notification_id_fkey" -- create a new foreign key constraint
                    FOREIGN KEY (notification_id) REFERENCES "Notifications" (id);
        `,
        { transaction: t, raw: true }
      );
      console.log('Added NotificationsRead notification_id foreign key');


      // duplicate subscription_id column into old_subscription_id
      await queryInterface.sequelize.query(`
          ALTER TABLE "NotificationsRead"
              RENAME COLUMN subscription_id TO old_subscription_id;
      `, { transaction: t, raw: true });
      await queryInterface.addColumn('NotificationsRead', 'subscription_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, {transaction: t});
      await queryInterface.sequelize.query(`
          UPDATE "NotificationsRead"
          SET subscription_id = old_subscription_id;
      `, {transaction: t, raw: true});

      // rename + recreate subscription_id fkey
      await queryInterface.sequelize.query(`
          ALTER TABLE "NotificationsRead"
              RENAME CONSTRAINT "NotificationsRead_subscription_id_fkey" TO "OldNotificationsRead_subscription_id_fkey";
      `, {transaction: t, raw: true});
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "NotificationsRead"
              ADD CONSTRAINT "NotificationsRead_subscription_id_fkey"
                  FOREIGN KEY (subscription_id) REFERENCES "Subscriptions"(id);
      `,
        { transaction: t, raw: true }
      );
      console.log('Notifications read subscription id key added');


      ////////////////////////// Clean-up and wrap-up /////////////////////

      // delete the created indices
      await queryInterface.sequelize.query(
        `
          DROP INDEX idx_notifications_read_notification_id;
      `,
        { transaction: t, raw: true }
      );
      console.log('Indexes dropped');

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Subscriptions"
            ALTER COLUMN created_at SET NOT NULL,
            ALTER COLUMN updated_at SET NOT NULL,
            ALTER COLUMN category_id SET NOT NULL,
            ALTER COLUMN subscriber_id SET NOT NULL,
            ALTER COLUMN object_id SET NOT NULL,
            ALTER COLUMN is_active SET NOT NULL,
            ALTER COLUMN immediate_email SET NOT NULL,
            ALTER COLUMN is_active SET DEFAULT True,
            ALTER COLUMN immediate_email SET DEFAULT False;
        `,
        { transaction: t, raw: true }
      );
      console.log('Added NOT NULL and DEFAULT constraints to Subscriptions');

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications"
            ALTER COLUMN created_at SET NOT NULL,
            ALTER COLUMN updated_at SET NOT NULL,
            ALTER COLUMN category_id SET NOT NULL;   
      `,
        { transaction: t, raw: true }
      );
      console.log('Added NOT NULL constraints to Notifications');
    });
  },

  down: async (queryInterface, Sequelize) => {
    // irreversible
  },
};
