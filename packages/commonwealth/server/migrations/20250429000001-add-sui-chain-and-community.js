'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();

      // Check if Sui chain node exists
      const [existingSuiNodes] = await queryInterface.sequelize.query(
        `SELECT id FROM "ChainNodes" WHERE LOWER(name) = 'sui mainnet' AND url = 'https://fullnode.mainnet.sui.io'`,
        { transaction },
      );

      let suiChainNodeId;

      // Define the Sui chain node data
      const suiChainNode = {
        name: 'Sui Mainnet',
        description: 'Sui Mainnet RPC Node',
        url: 'https://fullnode.mainnet.sui.io',
        alt_wallet_url: 'https://fullnode.mainnet.sui.io',
        private_url: 'https://fullnode.mainnet.sui.io',
        balance_type: 'sui',
        block_explorer: 'https://suiscan.com/',
        updated_at: now,
      };

      if (existingSuiNodes.length > 0) {
        // Update existing node
        suiChainNodeId = existingSuiNodes[0].id;
        await queryInterface.bulkUpdate(
          'ChainNodes',
          suiChainNode,
          { id: suiChainNodeId },
          { transaction },
        );
      } else {
        // Create new node
        suiChainNode.created_at = now;
        await queryInterface.bulkInsert('ChainNodes', [suiChainNode], {
          transaction,
        });

        // Get the ID of the newly created node
        const [suiChainNodes] = await queryInterface.sequelize.query(
          `SELECT id FROM "ChainNodes" WHERE name = 'Sui Mainnet' AND url = 'https://fullnode.mainnet.sui.io'`,
          { transaction },
        );

        if (suiChainNodes.length === 0) {
          throw new Error('Failed to create Sui chain node');
        }

        suiChainNodeId = suiChainNodes[0].id;
      }

      // Define the Sui community data
      const suiCommunity = {
        tier: 0, // Default tier
        spam_tier_level: 0, // Default spam tier level
        chain_node_id: suiChainNodeId,
        name: 'Sui',
        description:
          'Sui is a Layer 1 blockchain designed from the ground up to enable creators and developers to build experiences that cater to the next billion users in web3.',
        default_symbol: 'SUI',
        network: 'sui', // Using ChainNetwork enum from protocol.ts
        base: 'sui', // Using ChainBase.Sui from protocol.ts
        icon_url: 'https://assets.commonwealth.im/sui-logo.png',
        active: true,
        stages_enabled: true,
        type: 'chain', // Using ChainType.Chain from protocol.ts
        updated_at: now,
        environment: 'production',
      };

      // Check if Sui community exists
      const [existingSuiCommunity] = await queryInterface.sequelize.query(
        `SELECT id FROM "Communities" WHERE id = 'sui'`,
        { transaction },
      );

      if (existingSuiCommunity.length > 0) {
        // Update existing community
        await queryInterface.bulkUpdate(
          'Communities',
          suiCommunity,
          { id: 'sui' },
          { transaction },
        );
      } else {
        // Create new community
        suiCommunity.id = 'sui';
        suiCommunity.created_at = now;
        await queryInterface.bulkInsert('Communities', [suiCommunity], {
          transaction,
        });
      }

      // Check if General topic exists for Sui
      const [existingSuiTopic] = await queryInterface.sequelize.query(
        `SELECT id FROM "Topics" WHERE community_id = 'sui' AND name = 'General'`,
        { transaction },
      );

      const generalTopic = {
        name: 'General',
        community_id: 'sui',
        featured_in_sidebar: true,
        featured_in_new_post: true,
        updated_at: now,
      };

      if (existingSuiTopic.length > 0) {
        // Update existing topic
        await queryInterface.bulkUpdate(
          'Topics',
          generalTopic,
          { id: existingSuiTopic[0].id },
          { transaction },
        );
      } else {
        // Create new topic
        generalTopic.created_at = now;
        await queryInterface.bulkInsert('Topics', [generalTopic], {
          transaction,
        });
      }

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Delete in reverse order due to foreign key constraints
      // Delete the topics first
      await queryInterface.bulkDelete(
        'Topics',
        { community_id: 'sui' },
        { transaction },
      );

      // Delete the Sui community
      await queryInterface.bulkDelete(
        'Communities',
        { id: 'sui' },
        { transaction },
      );

      // Delete any ChainNodes with "sui" in the name (case-insensitive)
      await queryInterface.sequelize.query(
        `DELETE FROM "ChainNodes" WHERE LOWER(name) LIKE '%sui%'`,
        { transaction },
      );

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  },
};
