'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('Roles', [
      'address_id',
      'chain_id',
      'offchain_community_id',
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Roles', [
      'address_id',
      'chain_id',
      'offchain_community_id',
    ]);
  },
};
