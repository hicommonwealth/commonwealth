/* eslint-disable array-callback-return */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const selectQuery = 'SELECT * FROM "OffchainThreads"';
    const threads = await queryInterface.sequelize.query(selectQuery);
    const insertHistoryQueries = threads[0].map((thread, idx) => {
      if (!thread.version_history || !thread.version_history.length) {
        const firstVersionObj = {
          timestamp: thread.created_at,
          body: decodeURIComponent(thread.body),
        };
        try {
          const escapedStr = JSON.stringify(firstVersionObj).replace(
            /'/g,
            "''"
          );
          return `UPDATE "OffchainThreads" SET version_history=ARRAY['${escapedStr}'] WHERE id='${thread.id}'`;
        } catch (e) {
          console.log(e);
        }
      }
    });

    Promise.all(
      insertHistoryQueries.map((insertQuery) => {
        if (insertQuery) {
          return queryInterface.sequelize.query(insertQuery);
        }
      })
    );
  },

  down: (queryInterface, Sequelize) => {
    return new Promise((resolve, reject) => resolve());
  },
};
