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
        
        -- 2. Add NOT NULL constraints to the existing columns
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
            profile->>'name' as user_name,
            profile->>'avatar_url' as avatar_url,
            (ROW_NUMBER() OVER (ORDER BY total_xp DESC, id ASC))::int as rank
        FROM "Users" WHERE tier != 1;
        
        CREATE UNIQUE INDEX user_leaderboard_user_id_idx ON public.user_leaderboard (user_id);
        CREATE INDEX user_leaderboard_rank_idx ON public.user_leaderboard (rank);
        CREATE INDEX user_leaderboard_user_name_trgm_idx 
          ON public.user_leaderboard 
          USING gin (user_name gin_trgm_ops);
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
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
