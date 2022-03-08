'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      'DELETE FROM "OffchainReactions" WHERE address_id NOT IN (SELECT id FROM "Addresses")'
    );
  },

  down: (queryInterface, Sequelize) => {
    return Promise.resolve();
  },
};
