'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'agoric',
            symbol: 'RUN',
            name: 'Agoric',
            icon_url: '/static/img/protocols/agoric.png',
            type: 'chain',
            network: 'agoric',
            base: 'cosmos',
            active: true,
            description:
              'A Proof-of-Stake chain utilizing secure JavaScript smart contracts to rapidly build and deploy DeFi.',
            bech32_prefix: 'agoric',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'agoric',
            url: 'https://main.rpc.agoric.net:443/',
          },
        ],
        { transaction: t }
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'agoric' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['agoric'] },
        { transaction: t }
      );
    });
  },
};
