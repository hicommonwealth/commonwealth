'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS notifications_read_subscription_id_index
      ON "NotificationsRead"("subscription_id");
    `);

    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS notifications_read_subscription_id_index
      ON "NotificationsRead";
    `);

    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
