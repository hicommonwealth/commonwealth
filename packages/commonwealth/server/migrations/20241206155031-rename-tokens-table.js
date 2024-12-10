'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Tokens', 'LaunchpadTokens', {
        transaction,
      });
      await queryInterface.createTable(
        'PinnedTokens',
        {
          community_id: {
            type: Sequelize.STRING,
            primaryKey: true,
            references: {
              model: 'Communities',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          contract_address: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          chain_node_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'ChainNodes',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'ChainNodes',
        'alchemy_metadata',
        {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "ChainNodes"
          SET alchemy_metadata = CASE
                                       WHEN eth_chain_id = 1 THEN '{ "network_id": "eth-mainnet", "price_api_supported": true, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 81457 THEN '{ "network_id": "blast-mainnet", "price_api_supported": true, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 10 THEN '{ "network_id": "opt-mainnet", "price_api_supported": true, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 8453 THEN '{ "network_id": "base-mainnet", "price_api_supported": true, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 59144 THEN '{ "network_id": "linea-mainnet", "price_api_supported": true, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 42161 THEN '{ "network_id": "arb-mainnet", "price_api_supported": true, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 137 THEN '{ "network_id": "polygon-mainnet", "price_api_supported": true, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 11155111 THEN '{ "network_id": "eth-sepolia", "price_api_supported": false, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 84532 THEN '{ "network_id": "base-sepolia", "price_api_supported": false, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 421614 THEN '{ "network_id": "arb-sepolia", "price_api_supported": false, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 80002 THEN '{ "network_id": "polygon-amoy", "price_api_supported": false, "transfer_api_supported": true }'::JSONB
                                       WHEN eth_chain_id = 11155420 THEN '{ "network_id": "opt-sepolia", "price_api_supported": false, "transfer_api_supported": true }'::JSONB
                                       WHEN url = 'https://solana-mainnet.g.alchemy.com/v2/' THEN '{ "network_id": "solana-mainnet", "price_api_supported": true, "transfer_api_supported": false }'::JSONB
                                       WHEN url = 'https://solana-devnet.g.alchemy.com/v2/' THEN '{ "network_id": "solana-devnet", "price_api_supported": false, "transfer_api_supported": false }'::JSONB
              END
          WHERE private_url LIKE '%alchemy%' OR url LIKE '%alchemy%';
      `,
        { transaction },
      );

      // this only affects empty development db (no effect in prod)
      // the chain node here was manually updated in production but created via a migration
      await queryInterface.sequelize.query(
        `
        UPDATE "ChainNodes"
        SET alchemy_metadata = '{ "network_id": "arb-mainnet", "price_api_supported": true, "transfer_api_supported": true }'
        WHERE url = 'wss://arb-mainnet.g.alchemy.com/v2/';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
            ALTER TABLE "ChainNodes"
                ADD CONSTRAINT alchemy_metadata_check
                    CHECK (
                        (alchemy_metadata IS NOT NULL AND (url LIKE '%.g.alchemy.com%' OR private_url LIKE '%.g.alchemy.com%')) OR
                        (alchemy_metadata IS NULL AND (url NOT LIKE '%.g.alchemy.com%' AND private_url NOT LIKE '%.g.alchemy.com%'))
                        );
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('LaunchpadTokens', 'Tokens', {
        transaction,
      });
      await queryInterface.dropTable('PinnedTokens', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'alchemy_metadata', {
        transaction,
      });
    });
  },
};
