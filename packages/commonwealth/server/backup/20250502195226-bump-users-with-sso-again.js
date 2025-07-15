'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      WITH sso_users AS (
        SELECT DISTINCT(user_id)
        FROM "Addresses"
        WHERE oauth_provider IS NOT NULL AND (
          oauth_email IS NULL OR (oauth_email IS NOT NULL and oauth_email_verified IS TRUE)
        ) AND verified IS NOT NULL
      )
      UPDATE "Users" U
      SET tier = 4
      FROM sso_users
      WHERE U.id = sso_users.user_id;
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
