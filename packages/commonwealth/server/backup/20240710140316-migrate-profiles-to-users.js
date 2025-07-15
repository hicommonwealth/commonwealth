'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Users"
        SET profile = COALESCE(
            jsonb_build_object(
                'name', P.profile_name,
                'email', P.email,
                'website', P.website,
                'bio', P.bio,
                'avatar_url', P.avatar_url,
                'slug', P.slug,
                'socials', P.socials,
                'background_image', P.background_image
            ), '{}'::jsonb)
        FROM "Profiles" P
        WHERE "Users".id = P.user_id;
        `,
        {
          transaction: t,
        },
      );
    });
  },

  async down() {
    // nothing to do
  },
};
