'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`UPDATE \"Chains\" SET "snapshot"='polarcat.eth' WHERE "id" = 'dydx-ropsten'`);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`UPDATE \"Chains\" SET "snapshot"=NULL WHERE "id" = 'dydx-ropsten'`);
    });
  }
};
