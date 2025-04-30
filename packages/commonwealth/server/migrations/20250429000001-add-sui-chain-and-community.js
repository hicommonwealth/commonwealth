'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First clear any existing records that might conflict
    await queryInterface.sequelize.query(
      `DELETE FROM "ChainNodes" WHERE LOWER(name) LIKE '%sui%'`,
    );
    await queryInterface.bulkDelete('Topics', { community_id: 'sui' });
    await queryInterface.bulkDelete('Communities', { id: 'sui' });

    // Create the Sui chain node
    const suiChainNode = {
      name: 'Sui',
      url: 'https://fullnode.mainnet.sui.io',
      balance_type: 'sui',
      block_explorer: 'https://suiscan.com/',
      created_at: new Date(),
      updated_at: new Date(),
    };

    await queryInterface.bulkInsert('ChainNodes', [suiChainNode]);

    // Get the ID of the newly created Sui chain node
    const [suiChainNodes] = await queryInterface.sequelize.query(
      `SELECT id FROM "ChainNodes" WHERE name = 'Sui' AND url = 'https://fullnode.mainnet.sui.io'`,
    );

    if (suiChainNodes.length === 0) {
      throw new Error('Failed to create Sui chain node');
    }

    const suiChainNodeId = suiChainNodes[0].id;
    const now = new Date();

    // Create the base Sui community using the chain node ID
    const suiCommunity = {
      id: 'sui',
      tier: 0, // Default tier
      spam_tier_level: 0, // Default spam tier level
      chain_node_id: suiChainNodeId,
      name: 'Sui',
      description:
        'Sui is a Layer 1 blockchain designed from the ground up to enable creators and developers to build experiences that cater to the next billion users in web3.',
      default_symbol: 'SUI',
      network: 'sui', // Using ChainNetwork enum from protocol.ts
      base: 'sui', // Using ChainBase.Sui from protocol.ts
      social_links: [],
      icon_url: 'https://assets.commonwealth.im/sui-logo.png',
      active: true,
      stages_enabled: true,
      type: 'chain', // Using ChainType.Chain from protocol.ts
      created_at: now,
      updated_at: now,
    };

    await queryInterface.bulkInsert('Communities', [suiCommunity]);

    // Add a general topic for the Sui community
    await queryInterface.bulkInsert('Topics', [
      {
        name: 'General',
        community_id: 'sui',
        featured_in_sidebar: true,
        featured_in_new_post: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse order due to foreign key constraints
    // Delete the topics first
    await queryInterface.bulkDelete('Topics', { community_id: 'sui' });

    // Delete the Sui community
    await queryInterface.bulkDelete('Communities', { id: 'sui' });

    // Delete any ChainNodes with "sui" in the name (case-insensitive)
    await queryInterface.sequelize.query(
      `DELETE FROM "ChainNodes" WHERE LOWER(name) LIKE '%sui%'`,
    );
  },
};
