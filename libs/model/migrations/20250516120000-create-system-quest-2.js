'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create Quest -2 (System Quest 2)
      await queryInterface.sequelize.query(
        `
        INSERT INTO "Quests" (
          "id",
          "name",
          "description",
          "quest_type",
          "image_url",
          "start_date",
          "end_date",
          "xp_awarded",
          "max_xp_to_end",
          "created_at",
          "updated_at"
        )
        VALUES (
          -2,                                     -- id
          'System Quest 2',                       -- name
          'Wallet linking system-level quest',    -- description
          'common',                               -- quest_type
          '',                                     -- image_url
          now(),                                  -- start_date
          '2100-01-01 00:00:00+00',               -- end_date
          0,                                      -- xp_awarded
          100,                                    -- max_xp_to_end
          now(),                                  -- created_at
          now()                                   -- updated_at
        );
        `,
        { transaction },
      );

      // Create Action Meta for Quest -2 (WalletLinked event)
      await queryInterface.sequelize.query(
        `
        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "reward_amount",
          "creator_reward_weight",
          "participation_limit",
          "created_at",
          "updated_at"
        )
        VALUES (
          -2,                     -- id
          -2,                     -- quest_id
          'WalletLinked',         -- event_name
          10,                     -- reward_amount
          0,                      -- creator_reward_weight
          'once_per_quest',       -- participation_limit
          now(),                  -- created_at
          now()                   -- updated_at
        );
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DELETE FROM "QuestActionMetas" WHERE "quest_id" = -2;
        DELETE FROM "Quests" WHERE "id" = -2;
        `,
        { transaction },
      );
    });
  },
};