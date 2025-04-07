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
      await queryInterface.sequelize.query(
        `
        UPDATE "Communities"
        SET spam_tier_level = CASE
          WHEN spam_tier_level = 0 THEN -1
          WHEN spam_tier_level = 1 THEN 2
          WHEN spam_tier_level = 2 THEN 3
        ELSE -1 END
        WHERE spam_tier_level != -1;
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
