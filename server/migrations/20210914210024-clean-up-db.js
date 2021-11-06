'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return;
    return queryInterface.sequelize.transaction(async (transaction) => {
    // Query all addresses (not deleted) into Array
      const addresses = await queryInterface.sequelize.query(
        'SELECT id FROM "Addresses";',
        { transaction },
      );
      const addressIds = addresses[0].map((_) => _.id).join(', ');
      await queryInterface.sequelize.query(
        `DELETE FROM "OffchainReactions" WHERE address_id NOT IN (${addressIds});`,
        { transaction, logging: console.log },
      );

    });
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([]);
  }
};
