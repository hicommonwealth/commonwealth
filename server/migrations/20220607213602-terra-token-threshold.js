'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('ChainNodes', {
      url: 'https://lcd.phoenix.terra.setten.io/5e351408cfc5460186aa77ff1f38fac9',
    }, {
      chain: 'terra',
    }, {
      transaction: t
    });
    await queryInterface.bulkUpdate('Chain', {
      decimals: 6,
    }, {
      id: 'terra',
    }, {
      transaction: t
    });
    await queryInterface.bulkUpdate('Chain', {
      type: 'token',
    }, {
      id: 'terra',
    }, {
      transaction: t
    });
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('ChainNodes', {
      url: 'https://terra-rpc.cw-figment.workers.dev',
    }, {
      chain: 'terra',
    }, {
      transaction: t
    });
    await queryInterface.bulkUpdate('Chain', {
      decimals: null,
    }, {
      id: 'terra',
    }, {
      transaction: t
    });
    await queryInterface.bulkUpdate('Chain', {
      type: 'chain',
    }, {
      id: 'terra',
    }, {
      transaction: t
    });
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
