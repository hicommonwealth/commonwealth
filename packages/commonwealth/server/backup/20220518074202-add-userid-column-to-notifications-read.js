'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'NotificationsRead',
        'user_id',
        {
          type: Sequelize.INTEGER,
          references: { model: 'Users', key: 'id' },
        },
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "NotificationsRead" AS NR
        SET user_id = B.subscriber_id
        FROM (
            SELECT * FROM "Subscriptions"
        ) as B
        WHERE NR.subscription_id = B.id;
      `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        CREATE INDEX "NotificationsRead_user_index" ON "NotificationsRead"(user_id);
      `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "NotificationsRead" ALTER COLUMN user_id SET NOT NULL;
      `,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('NotificationsRead', 'user_id');
  },
};
