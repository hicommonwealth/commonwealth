'use strict';

const kovanTokens = [
  {
    'id': 'KOVAN_WETH',
    'name': 'WETH',
    'address': '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
    'decimals': 18,
    'symbol': 'WETH',
    'icon_url': '',
    'chain': 'ethereum-kovan'
  },
  {
    'id': 'KOVAN_USDC',
    'name': 'USDC',
    'address': '0xdcfab8057d08634279f8201b55d311c2a67897d2',
    'decimals': 2,
    'symbol': 'USDC',
    'icon_url': '',
    'chain': 'ethereum-kovan'
  },
  {
    'id': 'KOVAN_USDT',
    'name': 'USDT',
    'address': '0xf3e0d7bf58c5d455d31ef1c2d5375904df525105',
    'decimals': 7,
    'symbol': 'USDT',
    'icon_url': '',
    'chain': 'ethereum-kovan'
  },
  {
    'id': 'KOVAN_DAI',
    'name': 'Dai Stablecoin',
    'address': '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
    'decimals': 18,
    'symbol': 'DAI',
    'icon_url': '',
    'chain': 'ethereum-kovan'
  }
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('Tokens', 'chain', {
        type: Sequelize.STRING,
        reference: { model: 'Chains', key: 'id' }
      }, { transaction: t });

      await queryInterface.bulkInsert('Tokens', kovanTokens, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // remove all added tokens
      await queryInterface.bulkDelete('Tokens', { chain: 'ethereum-kovan' }, { transaction: t });

      // remove chain column
      await queryInterface.removeColumn('Tokens', 'chain', { transaction: t });
    });
  }
};
