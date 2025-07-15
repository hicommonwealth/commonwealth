'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      console.time('convert-parent-id');
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Comments"
          ALTER COLUMN parent_id TYPE INTEGER
          USING parent_id::INTEGER;
        `,
        { transaction: t },
      );
      console.timeEnd('convert-parent-id');

      console.time('add-columns');
      await Promise.all([
        queryInterface.addColumn(
          'Comments',
          'comment_level',
          {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
          },
          { transaction: t },
        ),
        queryInterface.addColumn(
          'Comments',
          'reply_count',
          {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
          },
          { transaction: t },
        ),
      ]);
      console.timeEnd('add-columns');

      console.time('add-index');
      await queryInterface.addIndex('Comments', ['parent_id'], {
        transaction: t,
      });
      console.timeEnd('add-index');

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
              INNER JOIN comment_hierarchy CH ON C.parent_id = CH.id
          )
          UPDATE "Comments" AS C
          SET comment_level = CH.comment_level
          FROM comment_hierarchy CH
          WHERE C.id = CH.id
            AND C.comment_level IS DISTINCT FROM CH.comment_level;
        `,
        { transaction: t },
      );
      console.timeEnd('set-comment-levels');

      console.time('set-reply-counts');
      await queryInterface.sequelize.query(
        `
          UPDATE "Comments" AS C1
          SET reply_count = COALESCE((
              SELECT COUNT(*)
              FROM "Comments" AS C2
              WHERE C2.parent_id = C1.id
          ), 0)
          WHERE reply_count IS DISTINCT FROM (
              SELECT COALESCE((
                  SELECT COUNT(*)
                  FROM "Comments" AS C2
                  WHERE C2.parent_id = C1.id
              ), 0)
          );
        `,
        { transaction: t },
      );
      console.timeEnd('set-reply-counts');
    });
  },

  async down(queryInterface) {
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
