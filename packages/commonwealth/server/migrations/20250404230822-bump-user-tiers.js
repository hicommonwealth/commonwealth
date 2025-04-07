'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET tier = tier + 1
        WHERE tier > 0;
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET tier = tier + 1;
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Decrement Users.tier by 1 for all users with tier > 1
      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET tier = tier - 1
        WHERE tier > 1;
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET tier = tier - 1;
      `,
        { transaction },
      );
    });
  },
};
