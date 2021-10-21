'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate('Chains', {
        bech32_prefix: 'terra',
      }, {
        id: 'terra',
      }, {
        transaction: t
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate('Chains', {
        bech32_prefix: null,
      }, {
        id: 'terra',
      }, {
        transaction: t
      });
    });
  }
};
