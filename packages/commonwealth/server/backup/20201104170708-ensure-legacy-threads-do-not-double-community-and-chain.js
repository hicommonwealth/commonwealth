'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const query =
      'UPDATE "OffchainThreads" SET chain = null WHERE community IS NOT NULL;';
    return queryInterface.sequelize.query(query);
  },

  down: (queryInterface, Sequelize) => {
    // irreversible up
    return;
  },
};
