'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `CREATE INDEX idx_users_profile_name ON "Users" ((profile->>'name'));`,
        { transaction: t },
      );
    });
  },

  async down() {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS idx_users_profile_name;`,
        { transaction: t },
      );
    });
  },
};
