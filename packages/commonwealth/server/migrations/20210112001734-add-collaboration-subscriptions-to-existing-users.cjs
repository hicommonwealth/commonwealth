/* eslint-disable quotes */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `INSERT INTO "NotificationCategories" (name, description) VALUES ('new-collaboration', 'someone collaborates with a user')`
    );
    const category = await queryInterface.sequelize.query(
      `SELECT * FROM "NotificationCategories" WHERE name='new-collaboration'`
    );
    const users = await queryInterface.sequelize.query(`SELECT * FROM "Users"`);
    await Promise.all(
      users[0].map(async (user) => {
        const columns = `(subscriber_id, category_id, object_id, is_active, created_at, updated_at)`;
        const values = `('${user.id}', '${category[0][0].name}', 'user-${
          user.id
        }', '1', '${Sequelize.NOW()}', '${Sequelize.NOW()}')`;
        await queryInterface.sequelize.query(
          `INSERT INTO "Subscriptions" ${columns} VALUES ${values}`
        );
      })
    );
  },

  down: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query(`SELECT * FROM "Users"`);
    const category = await queryInterface.sequelize.query(
      `SELECT * FROM "NotificationCategories" WHERE name='new-collaboration'`
    );
    const subscriptions = await queryInterface.sequelize.query(
      `SELECT * FROM "Subscriptions" WHERE category_id='${category[0][0].name}'`
    );
    await Promise.all(
      subscriptions[0].map(async (sub) => {
        await queryInterface.sequelize.query(
          `DELETE FROM "Notifications" WHERE subscription_id='${sub.id}'`
        );
      })
    );
    await queryInterface.sequelize.query(
      `DELETE FROM "Subscriptions" WHERE category_id='${category[0][0].name}'`
    );
    await queryInterface.sequelize.query(
      `DELETE FROM "NotificationCategories" WHERE name='new-collaboration'`
    );
  },
};
