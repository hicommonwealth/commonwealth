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
        try {
          const firstVersionStr = JSON.stringify(firstVersionObj).replaceAll("'", "''");
          if (!firstFlag) {
            console.log('FIRST FLAG');
            console.log(`UPDATE "OffchainThreads" SET version_history=ARRAY['${firstVersionStr}'] WHERE id='${thread.id}'`);
            firstFlag = true;
          }
          return `UPDATE "OffchainThreads" SET version_history=ARRAY['${firstVersionStr}'] WHERE id='${thread.id}'`;
        } catch (e) {
          console.log(e);
        }
      } else {
        let pseudoArray = '';
        thread.version_history.map((version_history) => {
          try {
            const versionsStr = version_history.replaceAll("'", "''");
            pseudoArray += versionsStr;
            pseudoArray += ', ';
          } catch (e) {
            console.log(e);
          }
        });
        if (!secondFlag) {
          console.log('SECOND FLAG');
          console.log(pseudoArray);
          console.log(`UPDATE "OffchainThreads" SET version_history=ARRAY['${pseudoArray}'] WHERE id='${thread.id}'`);
          secondFlag = true;
        }
        if (!pseudoArray.length) {
          console.log(thread.version_history);
        }
        return `UPDATE "OffchainThreads" SET version_history=ARRAY['${pseudoArray}'] WHERE id='${thread.id}'`;
      }
    });

    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainThreads', 'version_history', { transaction: t });
      await queryInterface.addColumn('OffchainThreads', 'version_history', {
        type: Sequelize.ARRAY(Sequelize.JSON),
        allow_null: false,
        default_value: []
      }, { transaction: t });
      Promise.all(insertHistoryQueries.map(async (insertQuery) => {
        return queryInterface.sequelize.query(insertQuery, { transaction: t });
      }));
    });
  },

  down: (queryInterface, Sequelize) => {
    return new Promise((resolve, reject) => resolve());
  }
};
