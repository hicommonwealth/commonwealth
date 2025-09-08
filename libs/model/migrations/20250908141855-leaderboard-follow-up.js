'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP MATERIALIZED VIEW user_leaderboard;
      
        CREATE MATERIALIZED VIEW user_leaderboard AS
        SELECT 
            id as user_id,
            total_xp as xp_points,
            tier,
            (ROW_NUMBER() OVER (ORDER BY total_xp DESC, id ASC))::int as rank
        FROM "Users" WHERE tier > 3;
        
        CREATE UNIQUE INDEX user_leaderboard_user_id_idx ON public.user_leaderboard (user_id);
        CREATE INDEX user_leaderboard_rank_idx ON public.user_leaderboard (rank);
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
      CREATE OR REPLACE FUNCTION create_quest_xp_leaderboard(quest_id_param INTEGER, tier_param INTEGER)
          RETURNS VOID
          LANGUAGE plpgsql
      AS $$
      DECLARE
          view_name TEXT;
          user_index_name TEXT;
          rank_index_name TEXT;
          create_view_sql TEXT;
          create_user_index_sql TEXT;
          create_rank_index_sql TEXT;
      BEGIN
          -- Generate dynamic names
          view_name := 'quest_' || quest_id_param || '_xp_leaderboard';
          user_index_name := 'quest_' || quest_id_param || '_xp_leaderboard_user_id';
          rank_index_name := 'quest_' || quest_id_param || '_xp_leaderboard_rank';
      
          -- Drop existing view if it exists
          EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS "' || view_name || '" CASCADE';
      
          -- Build the CREATE MATERIALIZED VIEW statement
          create_view_sql := '
              CREATE MATERIALIZED VIEW "' || view_name || '" AS
              WITH user_xp_combined AS (
                  SELECT
                      l.user_id as user_id,
                      COALESCE(l.xp_points, 0) as xp_points,
                      0 as creator_xp_points,
                      0 as referrer_xp_points
                  FROM "XpLogs" l
                           JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                           JOIN "Quests" q ON m.quest_id = q.id
                  WHERE l.user_id IS NOT NULL AND q.id = ' || quest_id_param || '
      
                  UNION ALL
      
                  SELECT
                      l.creator_user_id as user_id,
                      0 as xp_points,
                      COALESCE(l.creator_xp_points, 0) as creator_xp_points,
                      0 as referrer_xp_points
                  FROM "XpLogs" l
                           JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                           JOIN "Quests" q ON m.quest_id = q.id
                  WHERE l.creator_user_id IS NOT NULL AND q.id = ' || quest_id_param || '
      
                  UNION ALL
      
                  SELECT
                      l.referrer_user_id as user_id,
                      0 as xp_points,
                      0 as creator_xp_points,
                      COALESCE(l.referrer_xp_points, 0) as referrer_xp_points
                  FROM "XpLogs" l
                           JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                           JOIN "Quests" q ON m.quest_id = q.id
                  WHERE l.referrer_user_id IS NOT NULL AND q.id = ' || quest_id_param || '
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
              WHERE u.tier > ' || tier_param;
      
          -- Execute the CREATE MATERIALIZED VIEW
          EXECUTE create_view_sql;
      
          -- Create indexes
          create_user_index_sql := '
              CREATE UNIQUE INDEX "' || user_index_name || '"
              ON "' || view_name || '" (user_id)';
      
          create_rank_index_sql := '
              CREATE INDEX "' || rank_index_name || '"
              ON "' || view_name || '" (rank DESC)';
      
          EXECUTE create_user_index_sql;
          EXECUTE create_rank_index_sql;
      
          RAISE NOTICE 'Created materialized view: %', view_name;
      END;
      $$;
    `,
        { transaction },
      );
      const questIds = await queryInterface.sequelize.query(
        `
        SELECT id FROM "Quests";
      `,
        { transaction, raw: true, type: Sequelize.QueryTypes.SELECT },
      );

      for (const { id: quest_id } of questIds) {
        await queryInterface.sequelize.query(
          `
            SELECT create_quest_xp_leaderboard(${quest_id}, 3);
          `,
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
