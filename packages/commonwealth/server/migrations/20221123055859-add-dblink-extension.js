'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `CREATE EXTENSION IF NOT EXISTS dblink;`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP EXTENSION dblink;`);
  },
};
