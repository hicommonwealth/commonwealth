'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Query all addresses (not deleted) into Array
      const addresses = await queryInterface.sequelize.query(
        'SELECT id FROM "Addresses";',
        { transaction }
      );

      let addressIds = addresses[0].map((_) => _.id).join(', ');

      // if you have no addresses i.e. empty Address table addressIds is empty and causes
      // a migration error so instead use filler -1 (empty string also fails) since no id
      // will ever be -1
      if (addressIds.length === 0) addressIds = '-1';

      await queryInterface.sequelize.query(
        `DELETE FROM "OffchainReactions" WHERE address_id NOT IN (${addressIds});`,
        { transaction, logging: console.log }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([]);
  },
};
