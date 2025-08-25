'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create Quest -6
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
          -6,                                     -- id
          'Bonus: Sign Up with Gate Wallet',      -- name
          'This is a bonus powered by Gate for initial sign up with Gate wallet. Visit Gate to explore more onchain: https://www.gate.io', -- description
          'common',                               -- quest_type
          'https://assets.commonwealth.im/gate-wallet-quest.png', -- image_url
          now(),                                  -- start_date
          '2100-01-01 00:00:00+00',               -- end_date
          0,                                      -- xp_awarded
          2000000,                                -- max_xp_to_end
          now(),                                  -- created_at
          now()                                   -- updated_at
        );
        `,
        { transaction },
      );

      // Create Action Metas for Quest -6
      await queryInterface.sequelize.query(
        `
        -- Action Meta -15: SignUpFlowCompleted (0 XP)
        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "content_id",
          "reward_amount",
          "creator_reward_weight",
          "participation_limit",
          "created_at",
          "updated_at"
        )
        VALUES (
          -15,                    -- id
          -6,                     -- quest_id
          'SignUpFlowCompleted',  -- event_name
          NULL,                   -- content_id
          0,                      -- reward_amount
          0,                      -- creator_reward_weight
          'once_per_quest',       -- participation_limit
          now(),                  -- created_at
          now()                   -- updated_at
        );

        -- Action Meta -16: WalletLinked with Gate Wallet (10 XP)
        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "content_id",
          "reward_amount",
          "creator_reward_weight",
          "participation_limit",
          "created_at",
          "updated_at"
        )
        VALUES (
          -16,                    -- id
          -6,                     -- quest_id
          'WalletLinked',         -- event_name
          'wallet:gate',          -- content_id
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
        DELETE FROM "QuestActionMetas" WHERE "id" IN (-15, -16);
        DELETE FROM "Quests" WHERE "id" = -6;
        `,
        { transaction },
      );
    });
  },
};
