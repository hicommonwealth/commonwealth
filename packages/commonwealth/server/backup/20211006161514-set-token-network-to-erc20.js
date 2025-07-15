'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'Chains',
        { type: 'dao' },
        { id: 'compound' },
        { transaction: t }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { network: 'erc20' },
        {
          type: 'token',
          base: 'ethereum',
        },
        { transaction: t }
      );
    });
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
      await queryInterface.bulkUpdate(
        'Chains',
        { type: 'token' },
        { id: 'compound' },
        { transaction: t }
      );
    });
  },
};
