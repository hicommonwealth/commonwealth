'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const query = 'SELECT * FROM "OffchainThreads"';
    const threads = await queryInterface.sequelize.query(query);
    const parsedHistories = threads[0].map((thread) => {
      if (!thread.version_history || !thread.version_history.length) {
        const firstVersion = [{
          timestamp: thread.created_at,
          body: decodeURIComponent(thread.body)
        }];
        return `UPDATE "OffchainThreads" SET version_history=ARRAY${firstVersion} WHERE id='${thread.id}'`;
      } else {
        const versionHistoryJSON = thread.version_history.map((version) => {
          try {
            return JSON.parse(version);
          } catch (e) {
            console.log(e);
          }
        });
        return `UPDATE "OffchainThreads" SET version_history=ARRAY${versionHistoryJSON} WHERE id='${thread.id}'`;
      }
    });
    console.log(parsedHistories[0]);
    console.log(parsedHistories[100]);
  },

  down: (queryInterface, Sequelize) => {
    const query = 'SELECT * FROM "OffchainThreads"';
    return queryInterface.sequelize.query(query);
  }
};
