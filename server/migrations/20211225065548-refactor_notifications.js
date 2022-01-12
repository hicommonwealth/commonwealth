// eslint-disable-next-line max-len

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            // renames the current Notifications table to Old_Notifications
            await queryInterface.renameTable("Notifications", "OldNotifications", {transaction: t});

            // creates a new table called Notifications
            await queryInterface.createTable("Notifications", {
                id: {type: Sequelize.INTEGER, primaryKey: true},
                notification_data: {type: Sequelize.TEXT, allowNull: true},
                created_at: {type: Sequelize.DATE, allowNull: false},
                updated_at: {type: Sequelize.DATE, allowNull: false},
                chain_event_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: {model: "ChainEvents", key: "id"}
                },
                chain_id: {type: Sequelize.STRING, allowNull: true, references: {model: "Chains", key: "id"}},
                category_id: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    references: {model: "NotificationCategories", key: "name"}
                }
            }, {transaction: t});

            // create a new table called NotificationsRead
            await queryInterface.createTable("NotificationsRead", {
                notification_id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    references: {model: "Notifications", key: "id"}
                },
                subscription_id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    references: {model: "Subscriptions", key: "id"}
                },
                is_read: {type: Sequelize.BOOLEAN, allowNull: false}
            }, {transaction: t});

            // copies all UNIQUE (notifications that have the same notification_data AND chain_event_id notifications from OldNotifications to Notifications
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
                             FROM "OldNotifications"
                             GROUP BY (notification_data, chain_event_id)
                         ) as A;
                `,
                {
                    raw: true,
                    type: 'RAW',
                    transaction: t,
                }
            );

            // populates NotificationsRead table by getting notification_id, subscription_id and is_read using joins of
            // Notifications table (new notification_id with no duplicates) and OldNotifications table (subscription_id and is_read)
            await queryInterface.sequelize.query(
                `
                    INSERT INTO "NotificationsRead"
                    SELECT notification_id, subscription_id, cast(MAX(cast(is_read AS text)) as boolean)
                    FROM (
                             SELECT N1.id              as notification_id,
                                    O1.subscription_id as subscription_id,
                                    O1.is_read         as is_read
                             FROM "Notifications" N1
                                      JOIN "OldNotifications" O1 on N1.chain_event_id = O1.chain_event_id
                             UNION
                             SELECT N2.id              as notification_id,
                                    O2.subscription_id as subscription_id,
                                    O2.is_read         as is_read
                             FROM "Notifications" N2
                                      JOIN "OldNotifications" O2 on N2.notification_data = O2.notification_data
                             WHERE O2.notification_data != ''
                         ) as temp
                    GROUP BY (notification_id, subscription_id);
                `,
                {
                    raw: true,
                    type: 'RAW',
                    transaction: t,
                }
            );

            // populate chain_id's and category_ids for the new notifications
            await queryInterface.sequelize.query(
                `
                    UPDATE "Notifications" AS N
                    SET chain_id = A.chain_id,
                        category_id = B.category_id
                    FROM (
                             SELECT id,
                                    COALESCE(notification_data ->> 'chain_id',
                                             notification_data ->> 'chain', 
                                             notification_data ->> 'community_id') as chain_id
                             FROM (SELECT id, cast(notification_data as json)
                                   FROM "Notifications"
                                   WHERE chain_event_id IS NULL) as N_Data
                             UNION
                             SELECT NO.id as id, CET.chain as chain_id
                             FROM "Notifications" NO
                                      LEFT OUTER JOIN "ChainEvents" CE on NO.chain_event_id = CE.id
                                      LEFT OUTER JOIN "ChainEventTypes" CET on CE.chain_event_type_id = CET.id
                             WHERE NO.chain_event_id IS NOT NULL
                         ) AS A(id, chain_id),
                         (
                             SELECT N.id, S.category_id
                             FROM "Notifications" N
                                      LEFT OUTER JOIN "NotificationsRead" NR ON N.id = NR.notification_id
                                      LEFT OUTER JOIN "Subscriptions" S ON S.id = NR.subscription_id
                             GROUP BY (N.id, S.category_id)
                         ) AS B(id, category_id)

                    WHERE N.id = A.id
                      AND N.id = B.id;
                `,
                {
                    raw: true,
                    type: 'RAW',
                    transaction: t,
                }
            );

            // add the not null constraint for chain_id and category_id on Notifications table
            // this is done here because it is necessary to first
            await queryInterface.sequelize.query(`
                ALTER TABLE "Notifications"
                ALTER COLUMN "category_id"
                SET NOT NULL,
                ALTER COLUMN "chain_id"
                SET NOT NULL;
            `,
                {
                    raw: true,
                    type: 'RAW',
                    transaction: t,
                });
            // Cannot regenerate the original notification id's once the OldNotifications table is dropped
            // best to leave the old notification's table until smooth transition is confirmed (delete manually later)
            // await queryInterface.dropTable('OldNotifications');
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.dropTable('NotificationsRead', {transaction: t});
            await queryInterface.dropTable('Notifications', {transaction: t});
            await queryInterface.renameTable('OldNotifications', 'Notifications', {
                transaction: t,
            });
        });
    },
};
