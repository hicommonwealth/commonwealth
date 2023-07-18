'use strict';

const oldChainNode = 'https://matic-mainnet.chainstacklabs.com';
const newChainNode =
  'https://polygon-mainnet.g.alchemy.com/v2/5yLkuoKshDbUJdebSAQgmQUPtqLe3LO8';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate(
      'ChainNodes',
      {
        url: newChainNode,
        alt_wallet_url: newChainNode,
        name: 'Polygon',
      },
      {
        url: oldChainNode,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate(
      'ChainNodes',
      {
        url: oldChainNode,
        alt_wallet_url: oldChainNode,
        name: 'Matic',
      },
      {
        url: newChainNode,
      }
    );
  },
};
