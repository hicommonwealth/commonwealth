'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      console.time('add-columns');
      await queryInterface.addColumn(
        'Comments',
        'comment_level',
        {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false,
        },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'Comments',
        'reply_count',
        {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false,
        },
        { transaction: t },
      );
      console.timeEnd('add-columns');

      console.time('add-index');
      await queryInterface.addIndex('Comments', ['parent_id'], {
        transaction: t,
      });
      console.timeEnd('add-index');

      // set comment levels
      console.time('set-comment-levels');
      await queryInterface.sequelize.query(
        `
          WITH RECURSIVE comment_hierarchy AS (
              SELECT id, parent_id, 0 AS comment_level
              FROM "Comments"
              WHERE parent_id IS NULL

              UNION ALL

              SELECT C.id, C.parent_id, CH.comment_level + 1 AS comment_level
              FROM "Comments" C
              JOIN comment_hierarchy CH ON CAST(C.parent_id AS INTEGER) = CH.id
          )

          UPDATE "Comments" C
          SET comment_level = CH.comment_level
          FROM comment_hierarchy CH
          WHERE C.id = CH.id;
        `,
        {
          transaction: t,
        },
      );
      console.timeEnd('set-comment-levels');

      // set reply counts
      console.time('set-reply-counts');
      await queryInterface.sequelize.query(
        `
            WITH reply_counts AS (
                SELECT CAST(parent_id AS INTEGER) AS parent_id_int,
                       COUNT(*) AS total_replies
                FROM "Comments"
                WHERE parent_id IS NOT NULL
                GROUP BY CAST(parent_id AS INTEGER)
            )
            UPDATE "Comments" AS C1
            SET reply_count = COALESCE(rc.total_replies, 0)
            FROM reply_counts rc
            WHERE C1.id = rc.parent_id_int;
        `,
        {
          transaction: t,
        },
      );
      console.timeEnd('set-reply-counts');
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Comments', 'comment_level', {
        transaction: t,
      });
      await queryInterface.removeColumn('Comments', 'reply_count', {
        transaction: t,
      });
      await queryInterface.removeIndex('Comments', 'parent_id');
    });
  },
};
