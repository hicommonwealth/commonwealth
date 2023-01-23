/* eslint-disable array-callback-return */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const selectQuery = 'SELECT * FROM "OffchainComments"';
    const comments = await queryInterface.sequelize.query(selectQuery);
    const insertHistoryQueries = comments[0].map((comment, idx) => {
      if (!comment.version_history || !comment.version_history.length) {
        const firstVersionObj = {
          timestamp: comment.created_at,
          body: decodeURIComponent(comment.body),
        };
        try {
          const escapedStr = JSON.stringify(firstVersionObj).replace(
            /'/g,
            "''"
          );
          return `UPDATE "OffchainComments" SET version_history=ARRAY['${escapedStr}'] WHERE id='${comment.id}'`;
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
