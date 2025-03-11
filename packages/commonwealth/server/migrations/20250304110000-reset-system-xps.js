'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        -- reset system xps to zero in release 1
        UPDATE "QuestActionMetas" 
        SET "reward_amount" = 0, "creator_reward_weight" = 0 
        WHERE "quest_id" = -1;
        `,
        { transaction },
      );
    });
  },

  async down() {},
};
