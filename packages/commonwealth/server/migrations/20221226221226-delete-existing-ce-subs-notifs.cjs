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

      await queryInterface.dropTable('OldNotifications', {
        transaction: t,
        raw: true,
        cascade: true,
      });
      console.log('Old notifications table dropped');

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications"
              ADD CONSTRAINT "Notifications_category_id_fkey"
                  FOREIGN KEY (category_id) REFERENCES "NotificationCategories"(name);
      `,
        { transaction: t, raw: true }
      );
      console.log('category key added');

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications"
              ADD CONSTRAINT "Notifications_chain_id_fkey"
                  FOREIGN KEY (chain_id) REFERENCES "Chains"(id);
      `,
        { transaction: t, raw: true }
      );
      console.log('chain key added');

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications"
              ADD CONSTRAINT "Notifications_pkey1" PRIMARY KEY (id);
      `,
        { transaction: t, raw: true }
      );
      console.log('primary key added');

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

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Notifications"
              ADD CONSTRAINT "Notifications_unique_chain_event_id" UNIQUE (chain_event_id);
      `,
        { transaction: t, raw: true }
      );
      console.log('Added unique constraint');

      await queryInterface.sequelize.query(
        `
            CREATE INDEX new_chain_event_id ON "Notifications" (chain_event_id);
        `,
        { transaction: t, raw: true }
      );
      console.log('Added new_chain_event_id index');

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "NotificationsRead"
            ADD CONSTRAINT "NotificationsRead_notification_id_fkey" -- create a new foreign key constraint
            FOREIGN KEY (notification_id) REFERENCES "Notifications" (id);
      `,
        { transaction: t, raw: true }
      );
      console.log('Added NotificationsRead notification_id foreign key');

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

      await queryInterface.dropTable('OldSubscriptions', {
        transaction: t,
        raw: true,
        cascade: true,
      });
      console.log('Old subscriptions table dropped');

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Subscriptions"
              ADD CONSTRAINT "Subscriptions_category_id_fkey"
                  FOREIGN KEY (category_id) REFERENCES "NotificationCategories"(name);
      `,
        { transaction: t, raw: true }
      );
      console.log('category key added');

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Subscriptions"
              ADD CONSTRAINT "Subscriptions_subscriber_id_fkey"
                  FOREIGN KEY (subscriber_id) REFERENCES "Users"(id);
      `,
        { transaction: t, raw: true }
      );
      console.log('subscriber id key added');

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Subscriptions"
              ADD CONSTRAINT "Subscriptions_pkey" PRIMARY KEY (id);
      `,
        { transaction: t, raw: true }
      );
      console.log('primary key added');

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

      await queryInterface.sequelize.query(
        `
          CREATE INDEX subscriptions_offchain_thread_id ON "Subscriptions" (offchain_thread_id);
      `,
        { transaction: t, raw: true }
      );

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "NotificationsRead"
              ADD CONSTRAINT "NotificationsRead_subscription_id_fkey"
                  FOREIGN KEY (subscription_id) REFERENCES "Subscriptions"(id);
      `,
        { transaction: t, raw: true }
      );
      console.log('Notifications read subscription id key added');

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
