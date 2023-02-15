'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'ws://mainnet2.edgewa.re:9944',
        },
        {
          url: 'wss://mainnet2.edgewa.re',
        }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'wss://mainnet2.edgewa.re',
        },
        {
          url: 'ws://mainnet2.edgewa.re:9944',
        }
      );
    });
  },
};
