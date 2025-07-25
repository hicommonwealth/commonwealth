'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "reward_amount",
          "participation_limit",
          "participation_period",
          "created_at",
          "updated_at"
        )
        SELECT -100, -2, 'XpAwarded', 0, 'once_per_period', 'daily', now(), now()
        WHERE EXISTS (SELECT 1 FROM "Quests" WHERE "id" = -2);
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM "QuestActionMetas" WHERE "id" = -100;`,
    );
  },
};
