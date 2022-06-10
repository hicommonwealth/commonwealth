module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        INSERT INTO "NotificationCategories"
        VALUES ('new-chat-mention', 'someone mentions a user in chat');
      `, {transaction: t, raw: true, type: 'RAW'});

      await queryInterface.sequelize.query(`
        INSERT INTO "Subscriptions"
        SELECT nextval('"Subscriptions_id_seq"'::regclass) as id,
                id                                         as subscriber_id,
                'new-chat-mention'                         as category_id,
                ('user-' || id)                            as object_id,
                TRUE                                       as is_active,
                CURRENT_TIMESTAMP                          as created_at,
                CURRENT_TIMESTAMP                          as updated_at
        FROM "Users";
      `, {transaction: t, raw: true, type: 'RAW'});
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE
        FROM "Subscriptions"
        WHERE category_id = 'new-chat-mention';
      `, {transaction: t, raw: true, type: 'RAW'});

    await queryInterface.sequelize.query(`
        DELETE
        FROM "NotificationCategories"
        WHERE name = 'new-chat-mention';
    `, {transaction: t, raw: true, type: 'RAW'});
    })
  }
};
