'use strict';

// we need this again because the client-side creation code continued to create them incorrectly
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate(
      'Chains',
      { network: 'erc20' },
      {
        type: 'token',
        base: 'ethereum',
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      const tokens = await queryInterface.sequelize.query(
        "SELECT id FROM \"Chains\" WHERE type = 'token' AND base = 'ethereum';",
        { transaction: t }
      );
      for (const { id } of tokens[0]) {
        await queryInterface.bulkUpdate(
          'Chains',
          { network: id },
          { id },
          { transaction: t }
        );
      }
    });
  },
};
