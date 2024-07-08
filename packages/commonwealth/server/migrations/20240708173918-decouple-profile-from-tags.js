'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE public."ProfileTags" ADD COLUMN "user_id" INTEGER NOT NULL;
        UPDATE "ProfileTags" T SET user_id = P.user_id FROM public."Profiles" P WHERE T.profile_id = P.id;

        ALTER TABLE public."ProfileTags" DROP CONSTRAINT "ProfileTags_pkey";
        ALTER TABLE public."ProfileTags" DROP CONSTRAINT "fk_ProfileTags_profile_id";
        ALTER TABLE public."ProfileTags" DROP COLUMN "profile_id";

        ALTER TABLE public."ProfileTags" ADD CONSTRAINT "ProfileTags_pkey" PRIMARY KEY (user_id, tag_id);
        ALTER TABLE public."ProfileTags" ADD CONSTRAINT "fk_ProfileTags_user_id" 
        FOREIGN KEY (user_id) REFERENCES public."Users"(id);
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
        ALTER TABLE public."ProfileTags" ADD COLUMN "profile_id" INTEGER NOT NULL;
        UPDATE public."ProfileTags" T SET profile_id = P.id FROM public."Profiles" P WHERE T.user_id = P.user_id;

        ALTER TABLE public."ProfileTags" DROP CONSTRAINT "ProfileTags_pkey";
        ALTER TABLE public."ProfileTags" DROP CONSTRAINT "fk_ProfileTags_user_id";

        ALTER TABLE public."ProfileTags" ADD CONSTRAINT "ProfileTags_pkey" PRIMARY KEY (profile_id, tag_id);
        ALTER TABLE public."ProfileTags" ADD CONSTRAINT "fk_ProfileTags_profile_id"
        FOREIGN KEY (profile_id) REFERENCES public."Profiles"(id);

        ALTER TABLE public."ProfileTags" DROP COLUMN "user_id";
        `,
        {
          transaction: t,
        },
      );
    });
  },
};
