'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
        UPDATE "GroupPermissions"
        SET "allowed_actions" = array_append("allowed_actions", 'UPDATE_POLL')
        WHERE NOT 'UPDATE_POLL' = ANY ("allowed_actions");
    `);
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
