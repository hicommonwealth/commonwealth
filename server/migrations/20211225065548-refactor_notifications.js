// eslint-disable-next-line max-len

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // renames the current Notifications table to Old_Notifications
      await queryInterface.sequelize.query(
        `
            ALTER TABLE "Notifications"
                RENAME TO "Old_Notifications";
				`,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );

      // creates a new table called Notifications
      await queryInterface.sequelize.query(
        `
          CREATE TABLE IF NOT EXISTS "Notifications"
          (
            id                SERIAL PRIMARY KEY,
            notification_data text,
            created_at        timestamp with time zone,
            updated_at        timestamp with time zone,
            chain_event_id    integer REFERENCES "ChainEvents" (id),
            chain_id          varchar(255) REFERENCES "Chains" (id),
            --     community_id integer REFERENCES "Chains"(community_id),
            category_id       varchar(255) REFERENCES "NotificationCategories" (name)
          );
				`,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );

      // create a new table called Notifications_Read
      await queryInterface.sequelize.query(
        `
          CREATE TABLE IF NOT EXISTS "Notifications_Read"
          (
            notification_id integer REFERENCES "Notifications" (id),
            subscription_id integer REFERENCES "Subscriptions" (id),
            is_read         boolean,
            PRIMARY KEY (notification_id, subscription_id)
          );
				`,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );

      // copies all UNIQUE (notifications that have the same notification_data AND chain_event_id notifications from Old_Notifications to Notifications
      await queryInterface.sequelize.query(
        `
            INSERT INTO "Notifications"
            SELECT A.id,
                   A.notification_data,
                   CURRENT_TIMESTAMP as created_at,
                   CURRENT_TIMESTAMP as updated_at,
                   A.chain_event_id
            FROM (
                     SELECT ROW_NUMBER() OVER (ORDER BY chain_event_id) as id,
                            notification_data,
                            chain_event_id
                     FROM "Old_Notifications"
                     GROUP BY (notification_data, chain_event_id)
                 ) as A;
				`,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );

      // Adds is_read and subscriber_id from the old chain-event notifications to the Notifications_Read table.
      // This ensures that there are unique notifications in the Notifications table and references to those from the
      // Notifications_Read table.
      await queryInterface.sequelize.query(
        `
          INSERT INTO "Notifications_Read"
          SELECT N.id as notification_id, O.subscription_id as subscription_id, O.is_read as is_read
          FROM "Notifications" N
                 JOIN "Old_Notifications" O on N.chain_event_id = O.chain_event_id
          UNION
          SELECT N.id as notification_id, O.subscription_id as subscription_id, O.is_read as is_read
          FROM "Notifications" N
                 JOIN "Old_Notifications" O on N.notification_data = O.notification_data
          WHERE O.notification_data != '';
				`,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );

      // populate category_id's for the new notifications
      await queryInterface.sequelize.query(
        `
            UPDATE "Notifications" as N
            SET category_id = A.category_id
            FROM (SELECT DISTINCT(N.id) as id, S.category_id as category_id
                  FROM "Notifications" N,
                       "Notifications_Read" NR,
                       "Subscriptions" S
                  where N.id = NR.notification_id
                    AND NR.subscription_id = S.id) AS A
            WHERE N.id = A.id;
				`,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        }
      );

      // populate chain_id's for the new notifications
      await queryInterface.sequelize.query(`
              UPDATE "Notifications" AS N
        SET chain_id = A.chain_id
        FROM (
            SELECT id, COALESCE(notification_data->>'chain_id', notification_data->>'chain') as chain_id
            FROM (SELECT id, cast(notification_data as json) FROM "Notifications" WHERE chain_event_id IS NULL) as N_Data
            UNION
            SELECT NO.id as id, CET.chain as chain_id
            FROM "Notifications" NO
            LEFT OUTER JOIN "ChainEvents" CE on NO.chain_event_id = CE.id
            LEFT OUTER JOIN "ChainEventTypes" CET on CE.chain_event_type_id = CET.id
            WHERE NO.chain_event_id IS NOT NULL
        ) AS A(id, chain_id)
        WHERE N.id = A.id;
      `,
        {
          raw: true,
          type: 'RAW',
          transaction: t,
        });
      // Cannot regenerate the original notification id's once the Old_Notifications table is dropped
      // best to leave the old notification's table until smooth transition is confirmed (delete manually later)
      // await queryInterface.dropTable('Old_Notifications');
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('Notifications_Read', { transaction: t });
      await queryInterface.dropTable('Notifications', { transaction: t });
      await queryInterface.renameTable('Old_Notifications', 'Notifications', {
        transaction: t,
      });
    });
  },
};
