'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
      ALTER TABLE "NotificationsRead"
        ADD COLUMN IF NOT EXISTS id integer;
    `,
        { raw: true, transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        DO $$
            DECLARE userId INTEGER;
            DECLARE new_id INTEGER;
            DECLARE n_id INTEGER;
            DECLARE sub_id INTEGER;
        BEGIN
            FOR userID IN SELECT DISTINCT(user_id) FROM "NotificationsRead" LOOP
                FOR new_id, n_id, sub_id IN
                SELECT ROW_NUMBER() OVER (ORDER BY N.created_at) AS row_number, notification_id, subscription_id FROM "NotificationsRead" NR
                INNER JOIN "Notifications" N on N.id = NR.notification_id WHERE user_id = userId LOOP
                    UPDATE "NotificationsRead"
                    SET id = new_id
                    WHERE notification_id = n_id AND subscription_id = sub_id;
                END LOOP;
            END LOOP;
        END;
        $$;
    `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "NotificationsRead"
        ALTER COLUMN id SET NOT NULL;
      `,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('NotificationsRead', 'id');
  },
};
