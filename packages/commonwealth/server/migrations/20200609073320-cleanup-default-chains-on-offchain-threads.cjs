'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
UPDATE "OffchainThreads" SET chain=NULL WHERE chain='edgeware-testnet'`);
  },

  down: (queryInterface, Sequelize) => {
    // no down migration
    return new Promise((resolve) => resolve());
  },
};
