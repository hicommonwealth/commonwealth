'use strict';

const oldChainNodeEth = 'https://matic-mainnet.chainstacklabs.com';
const newChainNodeEth =
  'https://polygon-mainnet.g.alchemy.com/v2/5yLkuoKshDbUJdebSAQgmQUPtqLe3LO8';
const oldChainNodeBnb =
  'wss://holy-spring-wave.bsc.quiknode.pro/205d64ae5a12236f4d40137a3ef53ec663091881/';
const newChainNodeBnb = 'https://bsc-dataseed3.binance.org';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: newChainNodeEth,
          alt_wallet_url: newChainNodeEth,
          name: 'Polygon',
        },
        {
          url: oldChainNodeEth,
        },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: newChainNodeBnb,
        },
        {
          url: oldChainNodeBnb,
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: oldChainNodeEth,
          alt_wallet_url: oldChainNodeEth,
          name: 'Matic',
        },
        {
          url: newChainNodeEth,
        },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: oldChainNodeBnb,
        },
        {
          url: newChainNodeBnb,
        },
        { transaction }
      );
    });
  },
};
