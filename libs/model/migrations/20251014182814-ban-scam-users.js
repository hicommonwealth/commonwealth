'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET tier = 1
        WHERE profile ->> 'name' ~ '^Common Notifications #[0-9]+ ✅$';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses"
        SET is_banned = true
        WHERE user_id IN (
          SELECT id
          FROM "Users"
          WHERE profile ->> 'name' ~ '^Common Notifications #[0-9]+ ✅$'
        );
      `,
        { transaction },
      );
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
