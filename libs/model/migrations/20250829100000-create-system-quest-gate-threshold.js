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

      const quest_id = -6;
      const viewName = `quest_${quest_id}_xp_leaderboard`;
      await queryInterface.sequelize.query(
        `
    CREATE MATERIALIZED VIEW "${viewName}" AS
      WITH user_xp_combined AS (
          SELECT
              l.user_id as user_id,
              l.xp_points as xp_points,
              0 as creator_xp_points,
              0 as referrer_xp_points
          FROM "XpLogs" l
                   JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                   JOIN "Quests" q ON m.quest_id = q.id
          WHERE l.user_id IS NOT NULL AND q.id = ${quest_id}
      
          UNION ALL
      
          SELECT
              l.creator_user_id as user_id,
              0 as xp_points,
              l.creator_xp_points as creator_xp_points,
              0 as referrer_xp_points
          FROM "XpLogs" l
                   JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                   JOIN "Quests" q ON m.quest_id = q.id
          WHERE l.creator_user_id IS NOT NULL AND q.id = ${quest_id}
          
          UNION ALL
          
          SELECT
              l.referrer_user_id as user_id,
              0 as xp_points,
              0 as creator_xp_points,
              l.referrer_xp_points as referrer_xp_points
          FROM "XpLogs" l
                   JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                   JOIN "Quests" q ON m.quest_id = q.id
          WHERE l.referrer_user_id IS NOT NULL AND q.id = ${quest_id}
      ),
           aggregated_xp AS (
               SELECT
                   user_id,
                   SUM(xp_points)::int as total_user_xp,
                   SUM(creator_xp_points)::int as total_creator_xp,
                   SUM(referrer_xp_points)::int as total_referrer_xp
               FROM user_xp_combined
               GROUP BY user_id
           )
      SELECT
          a.user_id,
          (a.total_user_xp + a.total_creator_xp + a.total_referrer_xp) as xp_points,
          u.tier,
          ROW_NUMBER() OVER (ORDER BY (a.total_user_xp + a.total_creator_xp + a.total_referrer_xp) DESC, a.user_id ASC)::int as rank
      FROM aggregated_xp a
               JOIN "Users" u ON a.user_id = u.id
      WHERE u.tier > 1;
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
