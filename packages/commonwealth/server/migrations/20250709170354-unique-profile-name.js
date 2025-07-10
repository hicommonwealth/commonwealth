'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Users',
        'notify_user_name_change',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        { transaction },
      );

      // If two users have the same name, only keep the earliest users name.
      // Set the other users names to Anonymous, and set the
      // notify_user_name_change to true
      await queryInterface.sequelize.query(
        `
            WITH ranked_users AS (
                SELECT id, profile, created_at,
                    ROW_NUMBER() OVER (
                      PARTITION BY profile->>'name'
                      ORDER BY created_at ASC, id ASC
                ) AS rn
                FROM "Users"
                WHERE profile->>'name' <> 'Anonymous'
            ),
            to_update AS (
                SELECT id
                FROM ranked_users
                WHERE rn > 1
            )
            UPDATE "Users" u
            SET profile = jsonb_set(profile, '{name}', '"Anonymous"'),
                notify_user_name_change = true
            WHERE u.id IN (SELECT id FROM to_update);
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          CREATE UNIQUE INDEX unique_profile_name_not_anonymous
          ON "Users" ((profile ->> 'name'))
          WHERE (profile->>'name') IS DISTINCT FROM 'Anonymous';
             `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {},
};
