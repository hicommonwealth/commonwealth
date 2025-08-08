'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create Quest -5 (System Quest 5)
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
          -5,                                     -- id
          'System Quest 5',                       -- name
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

      // Create Action Meta for Quest -5 (same as system quest 2)
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
          -5,                     -- id
          -5,                     -- quest_id
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

      // Add the manual award action meta (same as quest -2 will have)
      await queryInterface.sequelize.query(
        `
        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "reward_amount",
          "participation_limit",
          "participation_period",
          "created_at",
          "updated_at"
        )
        VALUES (
          -101,                   -- id (unique, following pattern from -100)
          -5,                     -- quest_id
          'XpAwarded',            -- event_name
          0,                      -- reward_amount
          'once_per_period',      -- participation_limit
          'daily',                -- participation_period
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
        DELETE FROM "QuestActionMetas" WHERE "quest_id" = -5;
        DELETE FROM "Quests" WHERE "id" = -5;
        `,
        { transaction },
      );
    });
  },
};