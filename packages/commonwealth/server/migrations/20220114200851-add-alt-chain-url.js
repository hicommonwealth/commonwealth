'use strict';

const ALT_WALLET_URLS = [
  // ETH
  [1, 'https://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr'],
  [250, 'https://rpc.ftm.tools/'],
  [
    42161,
    'https://arb-mainnet.g.alchemy.com/v2/wJE2b7MRNJgk7S8dfgb_1xZNUDq7SF7G',
  ],
  [
    421611,
    'https://arb-rinkeby.g.alchemy.com/v2/WLfTX_HT-26kIjsBaBx7CrTHEi45v212',
  ],
  [3, 'https://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7'],
  [100, 'https://rpc.xdaichain.com/'],
  [42220, 'https://forno.celo.org'],
  [137, 'https://matic-mainnet.chainstacklabs.com'],
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'ChainNodes',
        'alt_wallet_url',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        {
          transaction: t,
        }
      );

      // populate the column for existing nodes
      for (const [id, url] of ALT_WALLET_URLS) {
        await queryInterface.sequelize.query(
          `UPDATE "ChainNodes" SET alt_wallet_url='${url}' WHERE eth_chain_id=${id}`,
          { transaction: t }
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('ChainNodes', 'alt_wallet_url');
  },
};
