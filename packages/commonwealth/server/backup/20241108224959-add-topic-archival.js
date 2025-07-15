'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Topics',
        'archived_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction },
      );

      // Delete soft deleted threads that have no topic_id and threads that aren't associated with any community
      await queryInterface.sequelize.query(
        `
            CREATE TEMPORARY TABLE temp_threads AS
            SELECT id
            FROM "Threads"
            WHERE topic_id IS NULL
              AND deleted_at IS NOT NULL;

            INSERT INTO temp_threads (id)
            SELECT T.id
            FROM "Threads" T
                     LEFT JOIN "Communities" C ON C.id = T.community_id
            WHERE C.id IS NULL;

            DELETE
            FROM "ThreadVersionHistories" TVH
                USING temp_threads T
            WHERE T.id = TVH.thread_id;

            DELETE
            FROM "Reactions" R
                USING temp_threads T
            WHERE T.id = R.thread_id;

            DELETE
            FROM "Polls" P
                USING temp_threads T
            WHERE T.id = P.thread_id;

            DELETE
            FROM "Collaborations" C
                USING temp_threads T
            WHERE T.id = C.thread_id;


            CREATE TEMPORARY TABLE temp_comments AS
            SELECT id
            FROM "Comments"
            WHERE thread_id IN (SELECT id FROM temp_threads);

            DELETE
            FROM "CommentVersionHistories" C
                USING temp_comments
            WHERE temp_comments.id = C.comment_id;

            DELETE
            FROM "Reactions" R
                USING temp_comments T
            WHERE T.id = R.comment_id;

            DELETE
            FROM "Comments" C
                USING temp_threads T
            WHERE T.id = C.thread_id;

            DELETE
            FROM "Threads" T1
                USING temp_threads T2
            WHERE T1.id = T2.id;
        `,
        { transaction },
      );

      // Transfer threads with no topic to General topic if available
      await queryInterface.sequelize.query(
        `
            UPDATE "Threads" T
            SET topic_id = (SELECT id
                            FROM "Topics"
                            WHERE deleted_at IS NULL
                              AND community_id = T.community_id
                              AND name = 'General'
                            LIMIT 1)
            WHERE topic_id IS NULL;
        `,
        { transaction },
      );

      // Theoretically there should not be any threads without a topic remaining
      // but this is a safeguard
      // Transfer threads with no topic to any random topic in the associated community
      await queryInterface.sequelize.query(
        `
        UPDATE "Threads" T
        SET topic_id = (SELECT id
                        FROM "Topics"
                        WHERE deleted_at IS NULL
                          AND community_id = T.community_id
                        LIMIT 1)
        WHERE topic_id IS NULL;
    `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Threads"
              ALTER COLUMN topic_id SET NOT NULL;
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Topics', 'archived_at', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
            ALTER TABLE "Threads"
                ALTER COLUMN topic_id DROP NOT NULL;
        `,
        { transaction },
      );
    });
  },
};
