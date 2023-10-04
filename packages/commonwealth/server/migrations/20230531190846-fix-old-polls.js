'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "Threads"
      SET "has_poll" = CASE WHEN (
        SELECT COUNT(*)
        FROM "Polls"
        WHERE "Threads"."id" = "Polls"."thread_id"
      ) > 0 THEN TRUE ELSE FALSE END
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Do nothing
  },
};
