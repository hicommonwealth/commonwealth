'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'UPDATE "Threads" SET archived_at = CURRENT_TIMESTAMP WHERE topic_id IS NULL',
        { transaction },
      );
      await queryInterface.addColumn(
        'Topics',
        'is_default',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        WITH oldest_topics AS (
            SELECT id,
                   community_id,
                   created_at,
                   ROW_NUMBER() OVER (PARTITION BY community_id ORDER BY created_at) AS row_num
            FROM "Topics"
            WHERE deleted_at IS NULL
        )
        UPDATE "Topics" t
        SET is_default = true
        FROM oldest_topics ot
        WHERE t.id = ot.id AND ot.row_num = 1;
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Topics', 'is_default', {
        transaction,
      });
    });
  },
};
