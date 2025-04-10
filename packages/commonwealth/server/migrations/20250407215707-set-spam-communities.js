'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      const now = new Date();
      await queryInterface.sequelize.query(
        `
          UPDATE "Communities"
          SET tier = 0
          WHERE id IN ('sanbounty-group', 'wen-base-mainnet', 'chao-tat-ca-ae-2025', 'cvalpha', 'abcd',
                       'tienvagai-community');

          CREATE TEMP TABLE "thread_ids" AS
          SELECT id
          FROM "Threads"
          WHERE community_id IN ('sanbounty-group', 'wen-base-mainnet', 'chao-tat-ca-ae-2025', 'cvalpha', 'abcd',
                                 'tienvagai-community');

          UPDATE "Threads" T
          SET marked_as_spam_at = ${now.toISOString()}
          FROM "thread_ids" ti
          WHERE T.id = ti.id;

          UPDATE "Comments" C
          SET marked_as_spam_at = ${now.toISOString()}
          FROM "thread_ids" ti
          WHERE ti.id = C."thread_id";
        `,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX idx_threads_is_not_spam ON "Threads" ((marked_as_spam_at IS NULL));`,
        { transaction: t },
      );

      await queryInterface.removeIndex(
        'Threads',
        'threads_activity_rank_date',
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `
        CREATE INDEX threads_activity_rank_date
        ON "Threads" (activity_rank_date DESC NULLS LAST)
        WHERE marked_as_spam_at IS NULL;
      `,
        { transaction: t },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    // irreversible
  },
};
