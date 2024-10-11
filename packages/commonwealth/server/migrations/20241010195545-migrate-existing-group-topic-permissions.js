'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          INSERT INTO "GroupTopicPermissions" 
            (group_id, topic_id, allowed_actions, created_at, updated_at)
          SELECT 
            unnest(t.group_ids) AS group_id, 
            t.id AS topic_id, 
            'UPVOTE_AND_COMMENT_AND_POST' AS allowed_actions, 
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
    // not really-possible/recommended to rollback since "GroupTopicPermissions" might have more entries
  },
};
