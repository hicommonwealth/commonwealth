'use strict';

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.query(
      `
      TRUNCATE TABLE "EmailUpdateTokens";
    `,
      {
        raw: true,
        type: 'RAW',
      },
    );
  },

  down: async () => {
    // not reversible
  },
};
