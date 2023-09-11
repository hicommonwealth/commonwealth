'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // raw query since `queryInterface.createTable` uniqueKeys option lacks documentation
      // uses SERIAL rather than GENERATED ALWAYS AS IDENTITY to ensure Sequelize compatibility
      await queryInterface.sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS "EvmEventSources" (
          id SERIAL PRIMARY KEY,
          chain_node_id INTEGER NOT NULL REFERENCES "ChainNodes"(id),
          contract_address VARCHAR(255) NOT NULL,
          event_signature VARCHAR(255) NOT NULL,
          kind VARCHAR(255) NOT NULL,
          CONSTRAINT unique_event_source UNIQUE(chain_node_id, contract_address, event_signature)
        );
      `,
        { transaction }
      );

      await queryInterface.createTable(
        'LastProcessedEvmBlocks',
        {
          chain_node_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            references: { model: 'ChainNodes', key: 'id' },
          },
          block_number: { type: Sequelize.INTEGER, allowNull: false },
        },
        { transaction }
      );

      await queryInterface.bulkInsert(
        'EvmEventSources',
        [
          // Aave on mainnet
          {
            chain_node_id: 37,
            contract_address: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: 37,
            contract_address: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
            event_signature:
              '0xd272d67d2c8c66de43c1d2515abb064978a5020c173e15903b6a2ab3bf7440ec',
            kind: 'proposal-created',
          },
          {
            chain_node_id: 37,
            contract_address: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
            event_signature:
              '0x9c85b616f29fca57a17eafe71cf9ff82ffef41766e2cf01ea7f8f7878dd3ec24',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: 37,
            contract_address: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
            event_signature:
              '0x11a0b38e70585e4b09b794bd1d9f9b1a51a802eb8ee2101eeee178d0349e73fe',
            kind: 'proposal-queued',
          },

          // autonomies-testnet-dao (semi-compound-bravo) on polygon-mumbai
          {
            chain_node_id: 46,
            contract_address: '0xac4610582926DcF22bf327AbB6F6aC82BD49FE0f',
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: 46,
            contract_address: '0xac4610582926DcF22bf327AbB6F6aC82BD49FE0f',
            event_signature:
              '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
            kind: 'proposal-created',
          },
          {
            chain_node_id: 46,
            contract_address: '0xac4610582926DcF22bf327AbB6F6aC82BD49FE0f',
            event_signature:
              '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: 46,
            contract_address: '0xac4610582926DcF22bf327AbB6F6aC82BD49FE0f',
            event_signature:
              '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
            kind: 'proposal-queued',
          },

          // dYdX (aave base) on mainnet
          {
            chain_node_id: 37,
            contract_address: '0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2',
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: 37,
            contract_address: '0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2',
            event_signature:
              '0xd272d67d2c8c66de43c1d2515abb064978a5020c173e15903b6a2ab3bf7440ec',
            kind: 'proposal-created',
          },
          {
            chain_node_id: 37,
            contract_address: '0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2',
            event_signature:
              '0x9c85b616f29fca57a17eafe71cf9ff82ffef41766e2cf01ea7f8f7878dd3ec24',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: 37,
            contract_address: '0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2',
            event_signature:
              '0x11a0b38e70585e4b09b794bd1d9f9b1a51a802eb8ee2101eeee178d0349e73fe',
            kind: 'proposal-queued',
          },

          // impact market (compound-bravo ish base) on celo
          {
            chain_node_id: 40,
            contract_address: '0x8f8BB984e652Cb8D0aa7C9D6712Ec2020EB1BAb4',
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: 40,
            contract_address: '0x8f8BB984e652Cb8D0aa7C9D6712Ec2020EB1BAb4',
            event_signature:
              '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
            kind: 'proposal-created',
          },
          {
            chain_node_id: 40,
            contract_address: '0x8f8BB984e652Cb8D0aa7C9D6712Ec2020EB1BAb4',
            event_signature:
              '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: 40,
            contract_address: '0x8f8BB984e652Cb8D0aa7C9D6712Ec2020EB1BAb4',
            event_signature:
              '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
            kind: 'proposal-queued',
          },

          // moola-market (compound-bravo ish base) on celo
          {
            chain_node_id: 40,
            contract_address: '0xde457ed1A713C290C4f8dE1dE0D0308Fc7722937',
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: 40,
            contract_address: '0xde457ed1A713C290C4f8dE1dE0D0308Fc7722937',
            event_signature:
              '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
            kind: 'proposal-created',
          },
          {
            chain_node_id: 40,
            contract_address: '0xde457ed1A713C290C4f8dE1dE0D0308Fc7722937',
            event_signature:
              '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: 40,
            contract_address: '0xde457ed1A713C290C4f8dE1dE0D0308Fc7722937',
            event_signature:
              '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
            kind: 'proposal-queued',
          },

          // tribe (compound base) on Ethereum mainnet
          {
            chain_node_id: 37,
            contract_address: '0x0BEF27FEB58e857046d630B2c03dFb7bae567494',
            event_signature:
              '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
            kind: 'proposal-canceled',
          },
          {
            chain_node_id: 37,
            contract_address: '0x0BEF27FEB58e857046d630B2c03dFb7bae567494',
            event_signature:
              '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
            kind: 'proposal-created',
          },
          {
            chain_node_id: 37,
            contract_address: '0x0BEF27FEB58e857046d630B2c03dFb7bae567494',
            event_signature:
              '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
            kind: 'proposal-executed',
          },
          {
            chain_node_id: 37,
            contract_address: '0x0BEF27FEB58e857046d630B2c03dFb7bae567494',
            event_signature:
              '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
            kind: 'proposal-queued',
          },
        ],
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('EvmEventSources', { transaction });
      await queryInterface.dropTable('LastProcessedEvmBlock', { transaction });
    });
  },
};
