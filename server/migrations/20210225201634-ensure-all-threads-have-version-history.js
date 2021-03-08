'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const selectQuery = 'SELECT * FROM "OffchainThreads"';
    const threads = await queryInterface.sequelize.query(selectQuery);
    const insertHistoryQueries = threads[0].map((thread) => {
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
    console.log(insertHistoryQueries[0]);
    console.log(insertHistoryQueries[100]);
    return queryInterface.sequelize.transaction((t) => {
      await queryInterface.removeColumn('OffchainThreads', 'version_history', { transaction: t });
      await queryInterface.addColumn('OffchainThreads', 'version_history', {
        type: Sequelize.ARRAY(JSON),
        allow_null: false,
        default_value: []
      }, { transaction: t });
      await Promise.all(insertHistoryQueries.map((insertQuery) => {
        return queryInterface.sequelize.query(insertQuery, { transaction: t });
      }));
    });
  },

  down: (queryInterface, Sequelize) => {
    return new Promise((resolve, reject) => resolve());
  }
};
