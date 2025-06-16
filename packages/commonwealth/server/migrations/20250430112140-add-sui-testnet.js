'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Add the Sui Testnet chain node
      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            url: 'https://fullnode.testnet.sui.io:443',
            alt_wallet_url: 'https://fullnode.testnet.sui.io:443',
            private_url: 'https://fullnode.testnet.sui.io:443',
            balance_type: 'sui', // Same balance_type as mainnet
            name: 'Sui Testnet',
            description: 'Sui Testnet RPC Node',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction: t },
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Remove the Sui Testnet chain node
      await queryInterface.bulkDelete(
        'ChainNodes',
        { name: 'Sui Testnet' },
        { transaction: t },
      );
    });
  },
};
