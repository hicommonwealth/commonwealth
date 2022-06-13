'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate('ChainNodes', {
        url: 'https://lcd.phoenix.terra.setten.io/5e351408cfc5460186aa77ff1f38fac9',
      }, {
        chain: 'terra',
      }, {
        transaction
      });
      await queryInterface.bulkUpdate('Chain', {
        decimals: 6,
      }, {
        id: 'terra',
      }, {
        transaction
      });
      await queryInterface.bulkUpdate('Chain', {
        type: 'token',
      }, {
        id: 'terra',
      }, {
        transaction
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate('ChainNodes', {
        url: 'https://terra-rpc.cw-figment.workers.dev',
      }, {
        chain: 'terra',
      }, {
        transaction
      });
      await queryInterface.bulkUpdate('Chain', {
        decimals: 9,
      }, {
        id: 'terra',
      }, {
        transaction
      });
      await queryInterface.bulkUpdate('Chain', {
        type: 'chain',
      }, {
        id: 'terra',
      }, {
        transaction
      });
    });
  }
};
