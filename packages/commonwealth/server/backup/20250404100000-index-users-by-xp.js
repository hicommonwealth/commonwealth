'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE INDEX users_xp_points_index ON "Users" (xp_points);
        `,
        { transaction },
      );
    });
  },

  async down() {},
};
