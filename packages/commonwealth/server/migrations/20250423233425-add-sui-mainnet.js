'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // First, add the Sui chain to the Chains table
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'sui',
            symbol: 'SUI',
            name: 'Sui Mainnet',
            icon_url: '/static/img/protocols/sui.png', // Make sure this image exists
            type: 'chain',
            network: 'sui',
            base: 'sui',
            active: true,
            description:
              'Sui is a layer-1 blockchain that offers high throughput and low latency.',
            website: 'https://sui.io',
            discord: 'https://discord.gg/sui',
            github: 'https://github.com/MystenLabs/sui',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction: t },
      );

      // Then, add the Sui chain node
      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'sui',
            url: 'https://sui-rpc.publicnode.com',
            balance_type: 'sui', // From the BalanceType enum we saw in protocol.ts
            name: 'Sui Mainnet',
            description: 'Sui Mainnet RPC Node',
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
      // Remove the Sui chain node
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'sui' },
        { transaction: t },
      );

      // Remove the Sui chain
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'sui' },
        { transaction: t },
      );
    });
  },
};
