'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // turn aave into a dao
      await queryInterface.bulkUpdate(
        'Chains',
        {
          icon_url: '/static/img/protocols/aave.png',
          type: 'dao',
          network: 'aave',
          collapsed_on_homepage: false,
        },
        {
          id: 'aave',
        },
        {
          transaction: t,
        }
      );

      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'wss://mainnet.infura.io/ws',
          address: '0xEC568fffba86c094cf06b22134B23074DFE2252c', // Governance
        },
        {
          chain: 'aave',
        },
        {
          transaction: t,
        }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'Chains',
        {
          icon_url:
            'https://assets.coingecko.com/coins/images/12645/thumb/AAVE.png?1601374110',
          type: 'token',
          network: 'ethereum',
          collapsed_on_homepage: true,
        },
        {
          id: 'aave',
        },
        {
          transaction: t,
        }
      );

      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'wss://mainnet.infura.io/ws',
          address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // token
        },
        {
          chain: 'aave',
        },
        {
          transaction: t,
        }
      );
    });
  },
};
