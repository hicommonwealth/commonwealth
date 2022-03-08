'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate(
      'ChainNodes',
      {
        address: '0x0BEF27FEB58e857046d630B2c03dFb7bae567494',
      },
      {
        chain: 'tribe',
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate(
      'ChainNodes',
      {
        address: '0xE087F94c3081e1832dC7a22B48c6f2b5fAaE579B',
      },
      {
        chain: 'tribe',
      }
    );
  },
};
