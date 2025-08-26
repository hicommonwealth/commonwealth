'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE public."Users" 
        SET xp_points = 0 
        WHERE xp_points IS NULL;
        
        UPDATE public."Users" 
        SET xp_referrer_points = 0 
        WHERE xp_referrer_points IS NULL;
        
        ALTER TABLE public."Users" 
        ALTER COLUMN xp_points SET NOT NULL;
        
        ALTER TABLE public."Users" 
        ALTER COLUMN xp_referrer_points SET NOT NULL;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE public."Users" 
        ADD COLUMN total_xp INTEGER DEFAULT 0;
        
        UPDATE public."Users" 
        SET total_xp = xp_points + xp_referrer_points;

        ALTER TABLE public."Users"
        ALTER COLUMN total_xp SET NOT NULL;
      `,
        { transaction },
      );
      console.log('Updated user columns');

      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION public.update_total_xp()
        RETURNS TRIGGER AS '
        BEGIN
            NEW.total_xp = NEW.xp_points + NEW.xp_referrer_points;
            RETURN NEW;
        END;
        ' LANGUAGE plpgsql;
        
        CREATE TRIGGER update_total_xp_trigger
        BEFORE INSERT OR UPDATE OF xp_points, xp_referrer_points
        ON public."Users"
        FOR EACH ROW
        EXECUTE FUNCTION public.update_total_xp();
      `,
        { transaction },
      );
      console.log('Added trigger');

      await queryInterface.sequelize.query(
        `
        CREATE INDEX users_total_xp_index
        ON public."Users" (tier, total_xp);
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE MATERIALIZED VIEW user_leaderboard AS
        SELECT 
            id as user_id,
            total_xp as xp_points,
            tier,
            (ROW_NUMBER() OVER (ORDER BY total_xp DESC, id ASC))::int as rank
        FROM "Users" WHERE tier > 1;
        
        CREATE UNIQUE INDEX user_leaderboard_user_id_idx ON public.user_leaderboard (user_id);
        CREATE INDEX user_leaderboard_rank_idx ON public.user_leaderboard (rank);
      `,
        { transaction },
      );

      console.log('Created global leaderboard view');

      const questIds = await queryInterface.sequelize.query(
        `
        SELECT id FROM "Quests";
      `,
        { transaction, raw: true, type: Sequelize.QueryTypes.SELECT },
      );

      for (const { id: quest_id } of questIds) {
        const viewName = `quest_${quest_id}_xp_leaderboard`;
        console.log(`creating view for ${viewName}`);

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
                  WHERE l.creator_user_id IS NOT NULL AND q.id = ${quest_id}
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
                  ROW_NUMBER() OVER (ORDER BY (a.total_user_xp + a.total_creator_xp) DESC, a.user_id ASC)::int as rank
              FROM aggregated_xp a
                       JOIN "Users" u ON a.user_id = u.id
              WHERE u.tier > 1;
        `,
          { transaction },
        );

        await queryInterface.sequelize.query(
          `
          CREATE UNIQUE INDEX "${viewName}_user_id" 
          ON "${viewName}" (user_id)
        `,
          { transaction },
        );

        await queryInterface.sequelize.query(
          `
          CREATE INDEX "${viewName}_rank"
            ON "${viewName}" (rank DESC);
        `,
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Drop the materialized view and its indexes
      await queryInterface.sequelize.query(
        `
        DROP MATERIALIZED VIEW IF EXISTS user_leaderboard;
      `,
        { transaction },
      );

      // Drop the index
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS users_total_xp_index;
      `,
        { transaction },
      );

      // Drop the trigger and function
      await queryInterface.sequelize.query(
        `
        DROP TRIGGER IF EXISTS update_total_xp_trigger ON public."Users";
        DROP FUNCTION IF EXISTS public.update_total_xp();
      `,
        { transaction },
      );

      // Drop the total_xp column
      await queryInterface.sequelize.query(
        `
        ALTER TABLE public."Users" 
        DROP COLUMN IF EXISTS total_xp;
      `,
        { transaction },
      );

      // Remove NOT NULL constraints from xp_points and xp_referrer_points
      await queryInterface.sequelize.query(
        `
        ALTER TABLE public."Users" 
        ALTER COLUMN xp_points DROP NOT NULL;
        
        ALTER TABLE public."Users" 
        ALTER COLUMN xp_referrer_points DROP NOT NULL;
      `,
        { transaction },
      );
    });
  },
};
