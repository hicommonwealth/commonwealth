'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
            DELETE
            FROM "EvmEventSources"
            WHERE event_signature NOT IN (?);
        `,
        {
          replacements: [
            [
              '0x2f0d66b98c7708890a982e2194479b066a117a6f9a8f418f7f14c6001965b78b',
              '0x32391ebd47fc736bb885d21a45d95c3da80aef6987aa90a5c6e747e9bc755bc9',
              '0x68d40dd5e34d499a209946f8e381c1258bdeff6dea4e96e9ab921da385c03667',
              '0x002817006cf5e3f9ac0de6817ca39830ac7e731a4949a59e4ac3c8bef988b20c',
              '0xba2ce2b4fab99c4186fd3e0a8e93ffb61e332d0c4709bd01d01e7ac60631437a',
            ],
          ],
          transaction,
        },
      );
      await queryInterface.addColumn(
        'EvmEventSources',
        'contract_name',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'EvmEventSources',
        {
          contract_name: 'SingleContest',
        },
        {
          abi_id: 55,
        },
        { transaction },
      );
      await queryInterface.bulkUpdate(
        'EvmEventSources',
        {
          contract_name: 'RecurringContest',
        },
        {
          abi_id: 54,
        },
        { transaction },
      );

      await queryInterface.addConstraint('EvmEventSources', {
        fields: ['contract_name'],
        type: 'check',
        where: {
          contract_name: ['SingleContest', 'RecurringContest'],
        },
        name: 'check_contract_name', // Optional: you can name your constraint
        transaction,
      });
      await queryInterface.changeColumn(
        'EvmEventSources',
        'contract_name',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeConstraint(
        'EvmEventSources',
        'EvmEventSources_chain_node_id_fkey',
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
          UPDATE "EvmEventSources" EES
          SET chain_node_id = (SELECT CN.eth_chain_id FROM "ChainNodes" CN WHERE CN.id = EES.chain_node_id);
      `,
        { transaction },
      );
      await queryInterface.renameColumn(
        'EvmEventSources',
        'chain_node_id',
        'eth_chain_id',
        { transaction },
      );

      await queryInterface.addColumn(
        'EvmEventSources',
        'parent_contract_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "EvmEventSources"
        SET parent_contract_address = CASE
            WHEN eth_chain_id = 8453 THEN '0xedf43C919f59900C82d963E99d822dA3F95575EA'
            WHEN eth_chain_id = 84532 THEN '0xD8a357847cABA76133D5f2cB51317D3C74609710'
            WHEN eth_chain_id = 11155111 THEN '0xEAB6373E6a722EeC8A65Fd38b014d8B81d5Bc1d4'
            WHEN eth_chain_id = 81457 THEN '0xedf43C919f59900C82d963E99d822dA3F95575EA'
            WHEN eth_chain_id = 59144 THEN '0xe3ae9569f4523161742414480f87967e991741bd'
            WHEN eth_chain_id = 10 THEN '0xe3ae9569f4523161742414480f87967e991741bd'
            WHEN eth_chain_id = 1 THEN '0x90aa47bf6e754f69ee53f05b5187b320e3118b0f'
            WHEN eth_chain_id = 42161 THEN '0xE3AE9569f4523161742414480f87967e991741bd'
        END;
      `,
        { transaction },
      );

      await queryInterface.changeColumn(
        'EvmEventSources',
        'parent_contract_address',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
            ALTER TABLE "EvmEventSources"
                DROP CONSTRAINT IF EXISTS "EvmEventSources_pkey",
                ADD PRIMARY KEY (eth_chain_id, contract_address, event_signature);
        `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
            ALTER TABLE "EvmEventSources"
                DROP CONSTRAINT IF EXISTS "unique_event_source";
        `,
        { transaction },
      );
      await queryInterface.removeColumn('EvmEventSources', 'id', {
        transaction,
      });
      await queryInterface.removeColumn('EvmEventSources', 'active', {
        transaction,
      });
      await queryInterface.removeColumn('EvmEventSources', 'abi_id', {
        transaction,
      });
      await queryInterface.removeColumn('EvmEventSources', 'kind', {
        transaction,
      });

      await queryInterface.dropTable('Templates', { transaction });
      await queryInterface.dropTable('ContractAbis', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
