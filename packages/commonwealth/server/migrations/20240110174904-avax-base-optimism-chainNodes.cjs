'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const baseChainNode = {
      url: 'https://base-mainnet.g.alchemy.com/v2/LZsi0DyfEpBVHfLxQsmt04IO7iBdanh_',
      eth_chain_id: 8453,
      alt_wallet_url:
        'https://base-mainnet.g.alchemy.com/v2/LZsi0DyfEpBVHfLxQsmt04IO7iBdanh_',
      balance_type: 'ethereum',
      name: 'Base',
    };

    const optimismChainNode = {
      url: 'https://opt-mainnet.g.alchemy.com/v2/QsmtYU6oC36UeqsSAfG5VS9NM6x6cggn',
      eth_chain_id: 10,
      alt_wallet_url:
        'https://opt-mainnet.g.alchemy.com/v2/QsmtYU6oC36UeqsSAfG5VS9NM6x6cggn',
      balance_type: 'ethereum',
      name: 'Optimism',
    };

    const avaxChainNode = {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      eth_chain_id: 43114,
      alt_wallet_url: 'https://api.avax.network/ext/bc/C/rpc',
      balance_type: 'ethereum',
      name: 'Avalanche',
    };

    await queryInterface.bulkInsert('ChainNodes', [
      baseChainNode,
      optimismChainNode,
      avaxChainNode,
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    const conditions = {
      [Sequelize.Op.or]: [
        {
          url: 'https://base-mainnet.g.alchemy.com/v2/LZsi0DyfEpBVHfLxQsmt04IO7iBdanh_',
        },
        {
          url: 'https://opt-mainnet.g.alchemy.com/v2/QsmtYU6oC36UeqsSAfG5VS9NM6x6cggn',
        },
        { url: 'https://api.avax.network/ext/bc/C/rpc' },
      ],
    };

    return queryInterface.bulkDelete('ChainNodes', conditions);
  },
};
