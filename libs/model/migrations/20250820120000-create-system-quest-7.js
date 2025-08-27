'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create Quest -7 (System Quest 7) - copy of quest -5 "Welcome to Common"
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
          -7,                                     -- id
          'Welcome to Common',                    -- name (same as quest -5)
          'Onboard to Common and gain XP',       -- description (same as quest -5)
          'common',                               -- quest_type
          'https://assets.commonwealth.im/fab3f073-9bf1-4ac3-8625-8b2ee258b5a8.png', -- image_url (same as quest -5)
          now(),                                  -- start_date (now)
          now() + interval '4 months',            -- end_date (4 months from now)
          0,                                      -- xp_awarded
          2000000,                                -- max_xp_to_end (same as quest -5)
          now(),                                  -- created_at
          now()                                   -- updated_at
        );
        `,
        { transaction },
      );

      // Create Action Metas for Quest -7 (same as quest -5 but with new IDs)
      await queryInterface.sequelize.query(
        `
        -- Action Meta: SignUpFlowCompleted (equivalent to ID -11 from quest -5)
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
          -15,                    -- id (new, starting at -15)
          -7,                     -- quest_id
          'SignUpFlowCompleted',  -- event_name
          10,                     -- reward_amount (same as quest -5)
          0.2,                    -- creator_reward_weight (same as quest -5)
          'once_per_quest',       -- participation_limit
          now(),                  -- created_at
          now()                   -- updated_at
        );

        -- Action Meta: WalletLinked (equivalent to ID -12 from quest -5)
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
          -16,                    -- id (new, continuing sequence from -15)
          -7,                     -- quest_id
          'WalletLinked',         -- event_name
          5,                      -- reward_amount (same as quest -5)
          0,                      -- creator_reward_weight
          'once_per_quest',       -- participation_limit
          now(),                  -- created_at
          now()                   -- updated_at
        );

        -- Action Meta: SSOLinked (equivalent to ID -13 from quest -5)
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
          -17,                    -- id (new, continuing sequence from -16)
          -7,                     -- quest_id
          'SSOLinked',            -- event_name
          5,                      -- reward_amount (same as quest -5)
          0,                      -- creator_reward_weight
          'once_per_quest',       -- participation_limit
          now(),                  -- created_at
          now()                   -- updated_at
        );

        -- Action Meta: XpAwarded for manual awards (equivalent to ID -14 from quest -5)
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
          -18,                    -- id (new, continuing sequence from -17)
          -7,                     -- quest_id
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

      const quest_id = -7;
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
        DELETE FROM "QuestActionMetas" WHERE "quest_id" = -7;
        DELETE FROM "Quests" WHERE "id" = -7;
        `,
        { transaction },
      );
    });
  },
};
