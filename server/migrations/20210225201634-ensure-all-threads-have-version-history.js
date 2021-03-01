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
      const version_history = [ JSON.stringify(firstVersion) ];
      if (i === 0) console.log(version_history);
      const update = `UPDATE "OffchainThreads" SET version_history=${version_history} WHERE id=${thread.id}`;
      return queryInterface.sequelize.query(update, { transaction: t });
    }));
  },

  down: (queryInterface, Sequelize) => {
    return null;
  }
};
