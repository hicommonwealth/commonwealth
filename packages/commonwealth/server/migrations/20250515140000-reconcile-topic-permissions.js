'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        -- commenting out this migration after removing the group_ids column 
-- INSERT INTO "GroupPermissions" (group_id, topic_id, allowed_actions, created_at, updated_at)
-- SELECT
--     unnest(t.group_ids) AS group_id,
--     t.id AS topic_id,
--     '{CREATE_COMMENT_REACTION,CREATE_THREAD_REACTION,CREATE_COMMENT,CREATE_THREAD,UPDATE_POLL}',
--     now(),
--     now()
-- FROM "Topics" t
--          LEFT JOIN (
--     SELECT topic_id, array_agg(DISTINCT group_id) AS existing_group_ids
--     FROM "GroupPermissions"
--     GROUP BY topic_id
-- ) gp ON t.id = gp.topic_id
-- WHERE NOT (
--     t.group_ids <@ COALESCE(gp.existing_group_ids, '{}')
--     )
-- ORDER BY 1,2
-- ON CONFLICT (topic_id, group_id) DO NOTHING;
        `,
        { transaction },
      );
    });
  },

  async down() {},
};
