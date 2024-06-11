'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      'DELETE FROM "ChainNodes" WHERE chain = \'ethereum\';'
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      "INSERT INTO \"ChainNodes\" (chain, url) VALUES ('ethereum', 'wss://mainnet.infura.io/ws');"
    );
  },
};
