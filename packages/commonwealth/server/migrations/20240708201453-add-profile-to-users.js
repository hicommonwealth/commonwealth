'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE public."Users" ADD COLUMN "profile" JSONB NOT NULL DEFAULT '{}'::jsonb;

        WITH P AS (
            SELECT user_id, 
                  jsonb_build_object(
                      'name', profile_name,
                      'email', email,
                      'website', website,
                      'bio', bio,
                      'avatar_url', avatar_url,
                      'slug', slug,
                      'socials', socials,
                      'background_image', background_image
                  ) AS profile_json
            FROM "Profiles"
        )
        UPDATE "Users" SET profile = COALESCE(P.profile_json, '{}'::jsonb)
        FROM P WHERE "Users".id = P.user_id;

        CREATE OR REPLACE FUNCTION update_user_profile() RETURNS TRIGGER AS $$
        BEGIN
            IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                UPDATE "Users"
                SET profile = jsonb_build_object(
                    'name', NEW.profile_name,
                    'email', NEW.email,
                    'website', NEW.website,
                    'bio', NEW.bio,
                    'avatar_url', NEW.avatar_url,
                    'slug', NEW.slug,
                    'socials', NEW.socials,
                    'background_image', NEW.background_image
                )
                WHERE id = NEW.user_id;
            END IF;
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER profile_sync_trigger AFTER INSERT OR UPDATE ON "Profiles"
        FOR EACH ROW EXECUTE FUNCTION update_user_profile();
        `,
        {
          transaction: t,
        },
      );
    });
  },

  async down() {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE public."Users" DROP COLUMN "profile";
        DROP TRIGGER IF EXISTS profile_sync_trigger ON public."Profiles";
        DROP FUNCTION IF EXISTS update_user_profile();
        `,
        {
          transaction: t,
        },
      );
    });
  },
};
