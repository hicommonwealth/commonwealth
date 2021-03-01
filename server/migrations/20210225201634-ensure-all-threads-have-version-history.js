'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const query = `SELECT * FROM "OffchainThreads" WHERE version_history IS NULL OR version_history='{}'`;
    const threads = await queryInterface.sequelize.query(query);
    return Promise.all(threads[0].map(async (thread, i) => {
      const firstVersion = {
        timestamp: thread.created_at,
        body: decodeURIComponent(thread.body)
      };
      const update = `UPDATE "OffchainThreads" SET version_history=ARRAY[${firstVersion}] WHERE id='${thread.id}'`;
      return queryInterface.sequelize.query(update);
    }));
  },

  down: (queryInterface, Sequelize) => {
    return null;
  }
};
