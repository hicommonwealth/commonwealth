'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE public."ProfileTags" ADD COLUMN "user_id" INTEGER;
        UPDATE "ProfileTags" T SET user_id = U.id 
        FROM public."Profiles" P JOIN public."Users" U on P.user_id = U.id
        WHERE T.profile_id = P.id;

        -- Drop records where user_id is NULL
        DELETE FROM public."ProfileTags" WHERE user_id IS NULL;
        ALTER TABLE public."ProfileTags" ALTER COLUMN "user_id" SET NOT NULL;

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
