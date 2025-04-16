'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create Quest -3
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
          -3,                                     -- id
          'Bonus: Sign Up with OKX Wallet',       -- name
          'This is a bonus powered by OKX for initial sign up with OKX wallet. Visit OKX to explore more onchain: https://web3.okx.com/', -- description
          'common',                               -- quest_type
          'https://assets.commonwealth.im/2bbf06e5-600a-4a49-a4d9-711237d79696.png', -- image_url
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

      // Create Action Metas for Quest -3
      await queryInterface.sequelize.query(
        `
        -- Action Meta -7: SignUpFlowCompleted (0 XP)
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
          -7,                     -- id
          -3,                     -- quest_id
          'SignUpFlowCompleted',  -- event_name
          NULL,                   -- content_id
          0,                      -- reward_amount
          0,                      -- creator_reward_weight
          'once_per_quest',       -- participation_limit
          now(),                  -- created_at
          now()                   -- updated_at
        );

        -- Action Meta -8: WalletLinked with OKX Wallet (10 XP)
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
          -8,                     -- id
          -3,                     -- quest_id
          'WalletLinked',         -- event_name
          'wallet:okx',         -- content_id
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
        DELETE FROM "QuestActionMetas" WHERE "id" IN (-7, -8);
        DELETE FROM "Quests" WHERE "id" = -3;
        `,
        { transaction },
      );
    });
  },
};
