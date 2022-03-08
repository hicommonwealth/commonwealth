'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        await queryInterface.bulkInsert(
          'Chains',
          [
            {
              id: 'ethereum',
              network: 'ethereum',
              symbol: 'ETH',
              icon_url: '/static/img/protocols/eth.png',
              name: 'Ethereum',
              active: true,
            },
            {
              id: 'ethereum-local',
              network: 'ethereum',
              symbol: 'ETH',
              icon_url: '/static/img/protocols/eth.png',
              name: 'Ethereum Local Testnet',
              active: true,
            },
          ],
          { transaction: t }
        );

        await queryInterface.bulkInsert(
          'ChainNodes',
          [
            {
              chain: 'ethereum-local',
              url: 'ws://127.0.0.1:7545',
            },
            {
              chain: 'ethereum',
              url: 'wss://mainnet.infura.io/ws',
            },
          ],
          { transaction: t }
        );
      } catch (e) {
        console.log(
          'Could not insert Ethereum nodes, maybe they already exist!'
        );
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        await queryInterface.bulkDelete(
          'Chains',
          {
            $or: [
              {
                name: 'Ethereum Local Testnet',
              },
              {
                name: 'Ethereum',
              },
            ],
          },
          { transaction: t }
        );

        await queryInterface.bulkDelete(
          'ChainNodes',
          {
            $or: [
              {
                chain: 'ethereum-local',
              },
              {
                chain: 'ethereum',
              },
            ],
          },
          { transaction: t }
        );
      } catch (e) {
        console.log('Error removing ETH chain, skipped');
      }
    });
  },
};
