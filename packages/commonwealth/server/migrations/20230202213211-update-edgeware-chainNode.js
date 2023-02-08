'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate(
      'ChainNodes',
      {
        url: 'wss://edgeware.jelliedowl.net/',
      },
      { id: 45 }
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate(
      'ChainNodes',
      {
        url: 'wss://edgeware-rpc.dwellir.com',
      },
      { id: 45 }
    );
  },
};
