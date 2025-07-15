'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // Add Base to ChainNode
      await queryInterface.addColumn(
        'ChainNodes',
        'chain_base',
        { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
        { transaction: t }
      );

      const chainz = await queryInterface.sequelize.query(
        `SELECT c.id as cid, c.base, cn.* FROM "Chains" c LEFT JOIN "ChainNodes" cn ON cn.id = c.chain_node_id;`,
        { transaction: t }
      );

      await Promise.all(
        chainz[0].map(async (c) => {
          const quer = `UPDATE "ChainNodes" SET chain_base='${c.base}' WHERE id=${c.id};`;
          await queryInterface.sequelize.query(quer, { transaction: t });
        })
      );

      // Create ContractAbis Table
      await queryInterface.createTable(
        'ContractAbis',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          abi: { type: Sequelize.JSONB, unique: true },
          verified: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction: t }
      );

      // Create Contracts Table
      await queryInterface.createTable(
        'Contracts',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          address: { type: Sequelize.STRING, allowNull: false },
          chain_node_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'ChainNodes', key: 'id' },
          },
          abi_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'ContractAbis', key: 'id' },
          },
          decimals: { type: Sequelize.INTEGER, allowNull: true },
          token_name: { type: Sequelize.STRING, allowNull: true },
          symbol: { type: Sequelize.STRING, allowNull: true },
          type: { type: Sequelize.STRING, allowNull: true }, // for governance erc20, etc.
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction: t }
      );

      // Create CommunityContracts Table
      await queryInterface.createTable(
        'CommunityContracts',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          chain_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'Chains', key: 'id' },
          },
          contract_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Contracts', key: 'id' },
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction: t }
      );

      // Migrate Current Chains to Contracts + CommunityContracts
      // eth + solana
      const query = `
        SELECT c.id as cid, cn.id as cnid, c.address, c.decimals, c.token_name, c.symbol, c.network
        FROM "Chains" c
        LEFT JOIN "ChainNodes" cn
        ON c.chain_node_id = cn.id
        WHERE (base='ethereum' AND address LIKE '0x%')
          OR (base='solana' AND address IS NOT NULL);`;
      const chains = await queryInterface.sequelize.query(query, {
        transaction: t,
      });
      await Promise.all(
        chains[0].map(async (c) => {
          // create Contract and CommuntiyContract
          await queryInterface.bulkInsert(
            'Contracts',
            [
              {
                address: c.address,
                chain_node_id: c.cnid,
                decimals: c.decimals,
                token_name: c.token_name,
                symbol: c.symbol,
                type: c.network,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            { transaction: t }
          );

          const contract = await queryInterface.sequelize.query(
            `SELECT * FROM "Contracts" WHERE address='${c.address}';`,
            { transaction: t }
          );
          if (!contract[0][0]) return;
          await queryInterface.bulkInsert(
            'CommunityContracts',
            [
              {
                chain_id: c.cid,
                contract_id: contract[0][0].id,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            { transaction: t }
          );
        })
      );

      // Migrate sputnik Contracts
      const sputQuery = `
      SELECT c.id as cid, cn.id as cnid, c.address, c.decimals, c.token_name, c.symbol, c.network
        FROM "Chains" c
        LEFT JOIN "ChainNodes" cn
        ON c.chain_node_id = cn.id WHERE network='sputnik';`;
      const sputChains = await queryInterface.sequelize.query(sputQuery, {
        transaction: t,
      });
      await Promise.all(
        sputChains[0].map(async (c) => {
          // create Contract
          await queryInterface.bulkInsert(
            'Contracts',
            [
              {
                address: c.cid, // sputnik chain id *is* the contract address on NEAR chain
                chain_node_id: c.cnid,
                decimals: c.decimals,
                token_name: c.token_name,
                symbol: c.symbol,
                type: c.network,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            { transaction: t }
          );

          const contract = await queryInterface.sequelize.query(
            `SELECT * FROM "Contracts" WHERE chain_node_id='19';`, // filter by NEAR's chain_node_id
            { transaction: t }
          );
          if (!contract[0][0]) return;
          await queryInterface.bulkInsert(
            'CommunityContracts',
            [
              {
                chain_id: c.cid,
                contract_id: contract[0][0].id,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            { transaction: t }
          );
        })
      );

      // Update Columns on Chains Table
      await queryInterface.renameColumn('Chains', 'symbol', 'default_symbol', {
        transaction: t,
      });
      await queryInterface.changeColumn(
        'Chains',
        'default_symbol',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );
      await queryInterface.removeColumn('Chains', 'decimals', {
        transaction: t,
      });
      await queryInterface.removeColumn('Chains', 'address', {
        transaction: t,
      });

      // Delete unused Contract-Named Tables
      await queryInterface.dropTable('ContractCategories', { transaction: t });
      await queryInterface.dropTable('ContractItems', { transaction: t });
    });

    // Add indexes
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex(
        'Contracts',
        { fields: ['address'] },
        { transaction: t }
      );
    });

    return new Promise((resolve, reject) => {
      resolve();
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Update Chains back
      await queryInterface.changeColumn(
        'Chains',
        'default_symbol',
        { type: Sequelize.STRING, allowNull: false },
        { transaction: t }
      );
      await queryInterface.renameColumn('Chains', 'default_symbol', 'symbol', {
        transaction: t,
      });
      await queryInterface.addColumn(
        'Chains',
        'decimals',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'address',
        { type: Sequelize.STRING, allowNull: true },
        { transaction: t }
      );

      const contracts = await queryInterface.sequelize.query(
        `SELECT c.decimals, c.address, cc.chain_id FROM "Contracts" c
        LEFT JOIN "CommunityContracts" cc ON c.id = cc.contract_id;`,
        { transaction: t }
      );

      await Promise.all(
        contracts[0].map(async (c) => {
          // Add contract stuff back on Chains model
          await queryInterface.sequelize.query(
            `UPDATE "Chains" c SET decimals=${c.decimals}, address='${c.address}' WHERE c.id = '${c.chain_id}';`,
            { transaction: t }
          );
        })
      );

      // DELETE column
      await queryInterface.removeColumn('ChainNodes', 'chain_base', {
        transaction: t,
      });

      // Delete Tables
      await queryInterface.dropTable('CommunityContracts', { transaction: t });
      await queryInterface.dropTable('Contracts', { transaction: t });
      await queryInterface.dropTable('ContractAbis', { transaction: t });

      // Re-add ContractCategories Table
      await queryInterface.createTable(
        'ContractCategories',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          name: { type: Sequelize.STRING, allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          color: { type: Sequelize.STRING, allowNull: false },
        },
        { transaction: t }
      );

      await queryInterface.createTable(
        'ContractItems',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          chain: { type: Sequelize.STRING, allowNull: false },
          name: { type: Sequelize.STRING, allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          color: { type: Sequelize.STRING, allowNull: false },
          category_id: { type: Sequelize.INTEGER, allowNull: false },
        },
        { transaction: t }
      );
    });
  },
};
