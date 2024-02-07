'use strict';

const oldChainNodeEth = 'https://matic-mainnet.chainstacklabs.com';
const newChainNodeEth =
  'https://polygon-mainnet.g.alchemy.com/v2/5yLkuoKshDbUJdebSAQgmQUPtqLe3LO8';

const oldChainNodeBnb =
  'wss://holy-spring-wave.bsc.quiknode.pro/205d64ae5a12236f4d40137a3ef53ec663091881/';
const newChainNodeBnb = 'https://bsc-dataseed3.binance.org';

const oldFantomNode =
  'wss://misty-rough-haze.fantom.quiknode.pro/057c57b1c826b348daa2694034b52a96cbb1b8ca/';
const newFantomNode = 'https://rpc.ftm.tools/';

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
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: newFantomNode,
        },
        {
          url: oldFantomNode,
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
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: oldFantomNode,
        },
        {
          url: newFantomNode,
        },
        { transaction }
      );
    });
  },
};
