'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      await queryInterface.sequelize.transaction(async (transaction) => {
        // Turn (topic_id, group_id) into the composite primary key
        await queryInterface.sequelize.query(
          `
          ALTER TABLE "GroupPermissions" ADD COLUMN topic_id INTEGER;
          ALTER TABLE "GroupPermissions" ADD CONSTRAINT GroupPermissions_topic_id_fkey
          FOREIGN KEY (topic_id) REFERENCES "Topics"(id);
          ALTER TABLE "GroupPermissions" DROP CONSTRAINT "GroupPermissions_pkey";
          ALTER TABLE "GroupPermissions" ADD PRIMARY KEY (topic_id, group_id);
          `,
          { transaction },
        );

        // Delete all group_ids that are present in the Topics.group_ids, but do not exist in the Groups table. Taken
        // from https://github.com/hicommonwealth/commonwealth/issues/8544#issuecomment-2240360779
        await queryInterface.sequelize.query(
          `
            WITH missing_group_ids AS (
                SELECT DISTINCT unnest_group_id AS missing_group_id
                FROM (
                         SELECT UNNEST(group_ids) AS unnest_group_id
                         FROM "Topics"
                     ) AS unnest_groups
                         LEFT JOIN "Groups" ON unnest_groups.unnest_group_id = "Groups".id
                WHERE "Groups".id IS NULL
            )
            UPDATE "Topics"
            SET group_ids = ARRAY(
                    SELECT id
                    FROM UNNEST(group_ids) AS id
                    WHERE id NOT IN (SELECT missing_group_id FROM missing_group_ids)
                            )
            WHERE EXISTS (
                SELECT 1
                FROM UNNEST(group_ids) AS id
                WHERE id IN (SELECT missing_group_id FROM missing_group_ids)
            );
          `,
          { transaction },
        );

        const topics = await queryInterface.sequelize.query(
          `SELECT id, group_ids FROM "Topics" WHERE array_length(group_ids, 1) > 0;`,
          {
            type: queryInterface.sequelize.QueryTypes.SELECT,
            raw: true,
            transaction,
          },
        );

        const permissionsData = topics.flatMap((topic) =>
          topic.group_ids.map((groupId) => ({
            group_id: groupId,
            topic_id: topic.id,
            created_at: new Date(),
            updated_at: new Date(),
            allowed_actions:
              '{CREATE_THREAD,CREATE_COMMENT,CREATE_THREAD_REACTION,CREATE_COMMENT_REACTION,UPDATE_POLL}',
          })),
        );
        await queryInterface.bulkInsert('GroupPermissions', permissionsData, {
          transaction,
        });
        await queryInterface.removeColumn('Topics', 'group_ids', {
          transaction,
        });
      });
    } catch (e) {
      console.log('Migration failed');
      throw e;
    }
  },

  async down() {},
};
