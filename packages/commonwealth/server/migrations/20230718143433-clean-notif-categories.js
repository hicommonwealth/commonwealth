'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        CREATE TEMPORARY TABLE subs_ids_to_delete as (
            SELECT id
            FROM "Subscriptions"
            WHERE category_id = 'new-chat-mention'
        );
      `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        DELETE FROM "NotificationsRead" NR
            USING subs_ids_to_delete ND
        WHERE NR.subscription_id = ND.id;
      `,
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        DELETE FROM "Subscriptions" S
            USING subs_ids_to_delete ND
        WHERE S.id = ND.id;
      `,
        { transaction: t }
      );

      await queryInterface.bulkDelete(
        'Notifications',
        {
          category_id: 'new-chat-mention',
        },
        { transaction: t }
      );

      await queryInterface.bulkDelete(
        'NotificationCategories',
        {
          name: {
            [Sequelize.Op.or]: [
              'entity-event',
              'new-chat-mention',
              'new-community-creation',
              'new-role-creation',
            ],
          },
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('NotificationCategories', [
      { name: 'entity-event', description: 'An entity event has occurred' },
      {
        name: 'new-chat-mention',
        description: 'someone mentions a user in chat',
      },
    ]);
  },
};
