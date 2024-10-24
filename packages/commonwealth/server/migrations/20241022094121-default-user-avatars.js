'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
            WITH random_avatars AS (
                SELECT id, (ARRAY[
                    'https://s3.us-east-1.amazonaws.com/local.assets/fb3289b0-38cb-4883-908b-7af0c1626ece.png',
                    'https://s3.us-east-1.amazonaws.com/local.assets/794bb7a3-17d7-407a-b52e-2987501221b5.png',
                    'https://s3.us-east-1.amazonaws.com/local.assets/181e25ad-ce08-427d-8d3a-d290af3be44b.png',
                    'https://s3.us-east-1.amazonaws.com/local.assets/9f40b221-e2c7-4052-a7de-e580222baaa9.png',
                    'https://s3.us-east-1.amazonaws.com/local.assets/ef919936-8554-42e5-8590-118e8cb68101.png',
                    'https://s3.us-east-1.amazonaws.com/local.assets/0847e7f5-4d96-4406-8f30-c3082fa2f27c.png'
                    ])[floor(random() * 6 + 1)] AS avatar_url
                FROM "Users"
                WHERE ("profile" ->> 'avatar_url') IS NULL
                   OR "profile" ->> 'avatar_url' = ''
            )
            UPDATE "Users"
            SET "profile" = jsonb_set("profile", '{avatar_url}', to_jsonb(random_avatars.avatar_url))
            FROM random_avatars
            WHERE "Users".id = random_avatars.id
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
            ALTER TABLE "Users"
                ADD CONSTRAINT "users_avatar_url_check"
                    CHECK (
                        ("profile" ->> 'avatar_url') IS NOT NULL AND
                        ("profile" ->> 'avatar_url') <> ''
                        );
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {},
};
