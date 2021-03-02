'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const query = `SELECT * FROM "OffchainThreads" WHERE version_history IS NULL OR version_history='{}'`;
    const threads = await queryInterface.sequelize.query(query);
    return Promise.all(threads[0].map(async (thread, i) => {
      const firstVersion = JSON.stringify({
        timestamp: thread.created_at,
        body: decodeURIComponent(thread.body)
      });
      return queryInterface.bulkUpdate('OffchainThreads', {
        version_history: [firstVersion],
      }, {
        id: thread.id,
      });
    }));
  },

  down: (queryInterface, Sequelize) => {
    return new Promise((resolve, reject) => resolve());
  }
};
