'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        -- add first profile to user
        ALTER TABLE public."Users" ADD COLUMN "profile" JSONB NOT NULL DEFAULT '{}'::jsonb;
        WITH FirstProfile AS (
            SELECT DISTINCT ON (user_id) 
                  user_id, 
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
            ORDER BY user_id, created_at
        )
        UPDATE "Users"
        SET profile = COALESCE(FirstProfile.profile_json, '{}'::jsonb)
        FROM FirstProfile
        WHERE "Users".id = FirstProfile.user_id;

        -- remove profile col from sso tokens
        ALTER TABLE public."SsoTokens" DROP CONSTRAINT "SsoTokens_profile_id_fkey";
        ALTER TABLE public."SsoTokens" DROP COLUMN "profile_id";

        -- copy user id to profile tags
        ALTER TABLE public."ProfileTags" ADD COLUMN "user_id" INTEGER NOT NULL;
        UPDATE "ProfileTags"
        SET user_id = P.user_id
        FROM "Profiles" AS P
        WHERE "ProfileTags".profile_id = P.id;

        -- remove id and profile id from profile tags
        ALTER TABLE public."ProfileTags" DROP CONSTRAINT "ProfileTags_pkey";
        ALTER TABLE public."ProfileTags" DROP CONSTRAINT "fk_ProfileTags_profile_id";
        ALTER TABLE public."ProfileTags" DROP COLUMN "profile_id";

        -- add constraints to profile tags
        ALTER TABLE public."ProfileTags" ADD CONSTRAINT "ProfileTags_pkey" PRIMARY KEY (user_id, tag_id);
        ALTER TABLE public."ProfileTags" ADD CONSTRAINT "fk_ProfileTags_user_id" 
        FOREIGN KEY (user_id) REFERENCES public."Users"(id);

        -- remove profile id from addresses
        ALTER TABLE public."Addresses" DROP COLUMN "profile_id";

        -- delete profile table
        DROP TABLE public."Profiles";
        `,
        {
          transaction: t,
        },
      );
    });
  },

  async down() {
    // TODO: Can we reverse this?
  },
};
