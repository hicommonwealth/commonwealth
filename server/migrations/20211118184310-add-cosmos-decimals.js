'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('Chains', {
      decimals: 6
    }, {
      id: 'osmosis'
    });
    await queryInterface.bulkUpdate('Chains', {
      decimals: 6,
      symbol: 'BLD'
    }, {
      id: 'agoric'
    });
    await queryInterface.bulkUpdate('Chains', {
      decimals: 9
    }, {
      id: 'terra'
    });
    await queryInterface.bulkUpdate('Chains', {
      decimals: 18
    }, {
      id: 'injective'
    });
    await queryInterface.bulkUpdate('Chains', {
      decimals: 18
    }, {
      id: 'injective-testnet'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('Chains', {
      decimals: null
    }, {
      id: 'osmosis'
    });
    await queryInterface.bulkUpdate('Chains', {
      decimals: null,
      symbol: 'RUN'
    }, {
      id: 'agoric'
    });
    await queryInterface.bulkUpdate('Chains', {
      decimals: null
    }, {
      id: 'terra'
    });
    await queryInterface.bulkUpdate('Chains', {
      decimals: null
    }, {
      id: 'injective'
    });
    await queryInterface.bulkUpdate('Chains', {
      decimals: null
    }, {
      id: 'injective-testnet'
    });
  }
};
