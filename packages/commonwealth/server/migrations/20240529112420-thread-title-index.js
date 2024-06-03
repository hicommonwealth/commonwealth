'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        CREATE INDEX threads_title_trgm_idx ON "Threads" USING gin (title gin_trgm_ops);
        `,
        { transaction: t },
      );
    });
  },

  async down(queryInterface, _) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS threads_title_trgm_idx;
        DROP EXTENSION IF EXISTS pg_trgm;
      `,
        { transaction: t },
      );
    });
  },
};
