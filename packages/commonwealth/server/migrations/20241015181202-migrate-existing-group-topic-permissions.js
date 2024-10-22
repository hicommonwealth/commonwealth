'use strict';
// TODO - remove this
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          DO $$
            BEGIN IF NOT EXISTS (
              SELECT 1
              FROM pg_type
              WHERE typname = 'enum_GroupPermissions_allowed_actions'
            ) 
            THEN
              CREATE TYPE enum_GroupPermissions_allowed_actions AS ENUM (
                'CREATE_COMMENT_REACTION', 
                'CREATE_THREAD_REACTION', 
                'CREATE_COMMENT', 
                'CREATE_THREAD'
              );
            END IF;
          END $$;


          INSERT INTO "GroupPermissions" 
            (group_id, topic_id, allowed_actions, created_at, updated_at)
          SELECT 
            unnest(t.group_ids) AS group_id, 
            t.id AS topic_id, 
            ARRAY[
              'CREATE_COMMENT_REACTION', 
              'CREATE_THREAD_REACTION', 
              'CREATE_COMMENT', 
              'CREATE_THREAD'
            ]::"enum_GroupPermissions_allowed_actions"[]
            AS allowed_actions, 
            NOW() AS created_at, 
            NOW() AS updated_at
            FROM "Topics" t
            WHERE 
            ARRAY_LENGTH(t.group_ids, 1) IS NOT NULL 
            AND ARRAY_LENGTH(t.group_ids, 1) > 0;
        `,
        { transaction: t },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    // not really-possible/recommended to rollback since "GroupPermissions" might have more entries
  },
};
