'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // some new-thread-creation subscriptions are missing a chain_id
      await queryInterface.sequelize.query(
        `
        UPDATE "Subscriptions"
        SET chain_id = object_id
        WHERE category_id = 'new-thread-creation' AND chain_id IS NULL;
      `,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
