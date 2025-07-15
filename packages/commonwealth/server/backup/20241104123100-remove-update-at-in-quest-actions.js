'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE "QuestActions" DROP COLUMN IF EXISTS "updated_at";`,
        { transaction },
      );
    });
  },

  down: async () => {},
};
