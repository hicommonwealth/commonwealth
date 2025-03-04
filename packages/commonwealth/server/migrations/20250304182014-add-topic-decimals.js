'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Topics', 'token_decimals', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "Topics"
      SET "token_decimals" = CASE
        WHEN token_symbol = 'USDC' THEN 6
        WHEN token_symbol IS NOT NULL THEN 18
        ELSE NULL
      END;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Topics', 'token_decimals');
  },
};
