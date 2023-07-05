'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'Chains',
        {
          chain_node_id: 37,
        },
        {
          chain_node_id: 1285,
        },
        {
          transaction: t,
        }
      );

      await queryInterface.bulkDelete(
        'ChainNodes',
        {
          id: 1285,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    // communities using the duplicate chain node could be created before this down migration is run thus leaving the
    // database in an inconsistent state
  },
};
