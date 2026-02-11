'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS threads_search_gin_idx
      ON "Threads" USING GIN (search)
      WHERE deleted_at IS NULL AND marked_as_spam_at IS NULL;
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS comments_search_gin_idx
      ON "Comments" USING GIN (search)
      WHERE deleted_at IS NULL AND marked_as_spam_at IS NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX CONCURRENTLY IF EXISTS threads_search_gin_idx;
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX CONCURRENTLY IF EXISTS comments_search_gin_idx;
    `);
  },
};
