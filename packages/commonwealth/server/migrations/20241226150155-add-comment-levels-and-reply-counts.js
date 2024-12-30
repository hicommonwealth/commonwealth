'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
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

      // set comment levels
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

      // TODO: this takes a lot of time and hangs the system. Needs optimization.
      // set reply counts
      // await queryInterface.sequelize.query(
      //   `
      //     UPDATE "Comments" C1
      //     SET reply_count = (
      //         SELECT COUNT(id)
      //         FROM "Comments" C2
      //         WHERE CAST(C2.parent_id AS INTEGER) = C1.id
      //     );
      //   `,
      //   {
      //     transaction: t,
      //   },
      // );
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
    });
  },
};
