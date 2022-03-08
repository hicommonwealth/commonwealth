'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'regen-network',
            symbol: 'REGEN',
            name: 'Regen Network',
            type: 'chain',
            network: 'regen',
            base: 'cosmos',
            active: true,
            description:
              'Regen Network is a sovereign, proof-of-stake blockchain built to ensure utility for ecological data and climate markets.',
            bech32_prefix: 'regen',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'regen-network',
            url: 'http://public-rpc.regen.vitwit.com:26657/',
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
        { chain: 'regen-network' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['regen-network'] },
        { transaction: t }
      );
    });
  },
};
