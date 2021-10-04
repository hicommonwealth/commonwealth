'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // TRIBE UPDATE
      await queryInterface.bulkUpdate('ChainNodes', {
        token_name: 'tribe',
      }, {
        chain: 'tribe'
      }, {
        transaction: t,
      });

      // FRAX UPDATE
      await queryInterface.bulkUpdate('ChainNodes', {
        token_name: 'fxs',
      }, {
        chain: 'frax'
      }, {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // TRIBE UPDATE
      await queryInterface.bulkUpdate('ChainNodes', {
        token_name: '',
      }, {
        chain: 'tribe'
      }, {
        transaction: t,
      });

      // FRAX UPDATE
      await queryInterface.bulkUpdate('ChainNodes', {
        token_name: '',
      }, {
        chain: 'frax'
      }, {
        transaction: t,
      });
    });
  },
};
