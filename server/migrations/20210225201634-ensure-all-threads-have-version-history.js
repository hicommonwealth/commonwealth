/* eslint-disable array-callback-return */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const selectQuery = 'SELECT * FROM "OffchainThreads"';
    const threads = await queryInterface.sequelize.query(selectQuery);
    let firstFlag = false;
    let secondFlag = false;
    const insertHistoryQueries = threads[0].map((thread, idx) => {
      if (!thread.version_history || !thread.version_history.length) {
        const firstVersionObj = {
          timestamp: thread.created_at,
          body: decodeURIComponent(thread.body)
        };
        let firstVersionStr;
        try {
          firstVersionStr = JSON.stringify(firstVersionObj);
          const escapedStr = firstVersionStr.replace(/'/g, "''");
          if (!firstFlag) {
            console.log('FIRST FLAG');
            console.log(`UPDATE "OffchainThreads" SET version_history=ARRAY['${escapedStr}'] WHERE id='${thread.id}'`);
            firstFlag = true;
          }
          return `UPDATE "OffchainThreads" SET version_history=ARRAY['${escapedStr}'] WHERE id='${thread.id}'`;
        } catch (e) {
          console.log(firstVersionStr);
          console.log(e);
        }
      }
    });

    return queryInterface.sequelize.transaction(async (t) => {
      Promise.all(insertHistoryQueries.map(async (insertQuery) => {
        return queryInterface.sequelize.query(insertQuery, { transaction: t });
      }));
    });
  },

  down: (queryInterface, Sequelize) => {
    return new Promise((resolve, reject) => resolve());
  }
};
