'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('NotificationsRead', { transaction });
      await queryInterface.dropTable('Subscriptions', { transaction });
      await queryInterface.dropTable('Notifications', { transaction });
      await queryInterface.dropTable('NotificationCategories', { transaction });

      await queryInterface.removeColumn(
        'Communities',
        'has_chain_events_listener',
        { transaction },
      );
      await queryInterface.removeColumn('Threads', 'max_notif_id', {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
