'use strict';

async function getChainNodeId(queryInterface, transaction, eth_chain_id) {
  const res = await queryInterface.sequelize.query(
    `
    SELECT id FROM "ChainNodes" WHERE eth_chain_id = ${eth_chain_id};
  `,
    { transaction, type: queryInterface.sequelize.QueryTypes.SELECT },
  );

  if (res.length > 0) {
    console.log(
      `Eth chain id ${eth_chain_id} - found chain node: ${res[0].id}`,
    );
    return res[0].id;
  }
}

async function deleteChainNodeDependencies(
  queryInterface,
  transaction,
  deprecatedChainNodeId,
) {
  await queryInterface.bulkDelete(
    'LastProcessedEvmBlocks',
    {
      chain_node_id: deprecatedChainNodeId,
    },
    { transaction },
  );

  await queryInterface.bulkDelete(
    'EvmEventSources',
    {
      chain_node_id: deprecatedChainNodeId,
    },
    { transaction },
  );

  const contractIds = await queryInterface.sequelize.query(
    `
          SELECT id FROM "Contracts" WHERE chain_node_id = ${deprecatedChainNodeId};
        `,
    { transaction, type: queryInterface.sequelize.QueryTypes.SELECT },
  );

  if (contractIds.length > 0) {
    await queryInterface.bulkDelete(
      'CommunityContracts',
      {
        contract_id: contractIds.map((c) => c.id),
      },
      { transaction },
    );
    await queryInterface.bulkDelete(
      'Contracts',
      {
        chain_node_id: deprecatedChainNodeId,
      },
      { transaction },
    );
  }

  console.log(`Deleted depedencies for chain node id ${deprecatedChainNodeId}`);
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // create new testnet chain nodes
      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            name: 'Ethereum Sepolia',
            url: 'https://eth-sepolia.g.alchemy.com/v2/G-9qTX3nSlAcihqA056hwGHiiolrUQj2',
            eth_chain_id: 11155111,
            alt_wallet_url:
              'https://eth-sepolia.g.alchemy.com/v2/G-9qTX3nSlAcihqA056hwGHiiolrUQj2',
            balance_type: 'ethereum',
            block_explorer: 'https://sepolia.etherscan.io/',
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            name: 'Base Sepolia',
            url: 'https://base-sepolia.g.alchemy.com/v2/VN9EV_LA2HboNvlzGlG55gBFbtO5qzrd',
            eth_chain_id: 84532,
            alt_wallet_url:
              'https://base-sepolia.g.alchemy.com/v2/VN9EV_LA2HboNvlzGlG55gBFbtO5qzrd',
            balance_type: 'ethereum',
            block_explorer: 'https://sepolia.basescan.org/',
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            name: 'Arbitrum Sepolia',
            url: 'https://arb-sepolia.g.alchemy.com/v2/WRi2_77HuAMaptI3eN7-JmjPXEigabNf',
            eth_chain_id: 421614,
            alt_wallet_url:
              'https://arb-sepolia.g.alchemy.com/v2/WRi2_77HuAMaptI3eN7-JmjPXEigabNf',
            balance_type: 'ethereum',
            block_explorer: 'https://sepolia.arbiscan.io/',
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            name: 'Optimism Sepolia',
            url: 'https://opt-sepolia.g.alchemy.com/v2/E45WLnHQ5-EK40l9-m5qh3tTWZzjuW-w',
            eth_chain_id: 11155420,
            alt_wallet_url:
              'https://opt-sepolia.g.alchemy.com/v2/E45WLnHQ5-EK40l9-m5qh3tTWZzjuW-w',
            balance_type: 'ethereum',
            block_explorer: 'https://sepolia-optimism.etherscan.io/',
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            name: 'Polygon Amoy',
            url: 'https://polygon-amoy.g.alchemy.com/v2/HJUZVxR1a7JF07T1QPsCCqIbqypydbT0',
            eth_chain_id: 80002,
            alt_wallet_url:
              'https://polygon-amoy.g.alchemy.com/v2/HJUZVxR1a7JF07T1QPsCCqIbqypydbT0',
            balance_type: 'ethereum',
            block_explorer: 'https://www.oklink.com/amoy',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );
      console.log('New chain nodes uploaded');

      // transfer Goerli communities to Sepolia
      const goerliChainNodeId = await getChainNodeId(
        queryInterface,
        transaction,
        5,
      );
      const sepoliaChainNodeId = await getChainNodeId(
        queryInterface,
        transaction,
        11155111,
      );
      if (goerliChainNodeId) {
        await deleteChainNodeDependencies(
          queryInterface,
          transaction,
          goerliChainNodeId,
        );
        await queryInterface.bulkUpdate(
          'Communities',
          {
            chain_node_id: sepoliaChainNodeId,
            type: 'offchain',
            network: 'ethereum',
          },
          {
            chain_node_id: goerliChainNodeId,
          },
          { transaction },
        );
        console.log(
          `All references to chainNodeId ${goerliChainNodeId} updated to ${sepoliaChainNodeId}`,
        );
      }

      // transfer Polygon Mumbai communities to Polygon Amoy
      const mumbaiChainNodeId = await getChainNodeId(
        queryInterface,
        transaction,
        80001,
      );
      const amoyChainNodeId = await getChainNodeId(
        queryInterface,
        transaction,
        80002,
      );
      if (mumbaiChainNodeId) {
        await deleteChainNodeDependencies(
          queryInterface,
          transaction,
          mumbaiChainNodeId,
        );
        await queryInterface.bulkUpdate(
          'Communities',
          {
            chain_node_id: amoyChainNodeId,
            type: 'offchain',
            network: 'ethereum',
          },
          {
            chain_node_id: mumbaiChainNodeId,
          },
          { transaction },
        );
        console.log(
          `All references to chainNodeId ${goerliChainNodeId} updated to ${sepoliaChainNodeId}`,
        );
      }

      const deprecatedIds = [];
      goerliChainNodeId && deprecatedIds.push(goerliChainNodeId);
      mumbaiChainNodeId && deprecatedIds.push(mumbaiChainNodeId);
      // delete deprecated test chain nodes
      await queryInterface.bulkDelete(
        'ChainNodes',
        {
          id: deprecatedIds,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
