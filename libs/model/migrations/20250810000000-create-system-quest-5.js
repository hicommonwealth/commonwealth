'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create Quest -5 (System Quest 5) - copy of quest -2 "Welcome to Common"
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
          'Welcome to Common',                    -- name (same as quest -2)
          'Onboard to Common and gain XP',       -- description (same as quest -2)
          'common',                               -- quest_type
          'https://assets.commonwealth.im/fab3f073-9bf1-4ac3-8625-8b2ee258b5a8.png', -- image_url (same as quest -2)
          now(),                                  -- start_date (now)
          now() + interval '4 months',            -- end_date (4 months from now)
          0,                                      -- xp_awarded
          2000000,                                -- max_xp_to_end (same as quest -2)
          now(),                                  -- created_at
          now()                                   -- updated_at
        );
        `,
        { transaction },
      );

      // Create Action Metas for Quest -5 (same as quest -2 but with new IDs)
      await queryInterface.sequelize.query(
        `
        -- Action Meta: SignUpFlowCompleted (equivalent to ID -4 from quest -2)
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
          -7,                     -- id (new, avoiding existing IDs)
          -5,                     -- quest_id
          'SignUpFlowCompleted',  -- event_name
          10,                     -- reward_amount (same as quest -2)
          0.2,                    -- creator_reward_weight (same as quest -2)
          'once_per_quest',       -- participation_limit
          now(),                  -- created_at
          now()                   -- updated_at
        );

        -- Action Meta: WalletLinked (equivalent to ID -5 from quest -2)
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
          -8,                     -- id (new, avoiding existing IDs)
          -5,                     -- quest_id
          'WalletLinked',         -- event_name
          5,                      -- reward_amount (same as quest -2, not 10!)
          0,                      -- creator_reward_weight
          'once_per_quest',       -- participation_limit
          now(),                  -- created_at
          now()                   -- updated_at
        );

        -- Action Meta: SSOLinked (equivalent to ID -6 from quest -2)
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
          -9,                     -- id (new, avoiding existing IDs)
          -5,                     -- quest_id
          'SSOLinked',            -- event_name
          5,                      -- reward_amount (same as quest -2)
          0,                      -- creator_reward_weight
          'once_per_quest',       -- participation_limit
          now(),                  -- created_at
          now()                   -- updated_at
        );

        -- Action Meta: XpAwarded for manual awards (equivalent to ID -100 from quest -2)
        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "reward_amount",
          "creator_reward_weight",
          "participation_limit",
          "participation_period",
          "created_at",
          "updated_at"
        )
        VALUES (
          -101,                   -- id (new, avoiding existing IDs)
          -5,                     -- quest_id
          'XpAwarded',            -- event_name
          0,                      -- reward_amount
          0,                      -- creator_reward_weight
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