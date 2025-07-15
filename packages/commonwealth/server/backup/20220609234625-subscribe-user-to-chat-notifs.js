module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        INSERT INTO "NotificationCategories"
        VALUES ('new-chat-mention', 'someone mentions a user in chat', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `,
        { transaction: t, raw: true, type: 'RAW' }
      );

      await queryInterface.sequelize.query(
        `
        INSERT INTO "Subscriptions" (subscriber_id, category_id, object_id, created_at, updated_at)
        SELECT  id,
                'new-chat-mention',
                ('user-' || id),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP 
        FROM "Users";
      `,
        { transaction: t, raw: true, type: 'RAW' }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        DELETE
        FROM "Subscriptions"
        WHERE category_id = 'new-chat-mention';
      `,
        { transaction: t, raw: true, type: 'RAW' }
      );

      await queryInterface.sequelize.query(
        `
        DELETE
        FROM "NotificationCategories"
        WHERE name = 'new-chat-mention';
    `,
        { transaction: t, raw: true, type: 'RAW' }
      );
    });
  },
};
