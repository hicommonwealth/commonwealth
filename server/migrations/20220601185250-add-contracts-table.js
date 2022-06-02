'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Create Contracts Table
      await queryInterface.createTable('Contracts', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        address: { type: Sequelize.STRING, allowNull: false },
        chain_node_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'ChainNodes', key: 'id' } },
        decimals: { type: Sequelize.INTEGER, allowNull: true },
        token_name: { type: Sequelize.STRING, allowNull: true },
        symbol: {type: Sequelize.STRING, allowNull: true},
        type: { type: Sequelize.STRING, allowNull: false }, // for governance erc20, etc.
      }, { transaction: t });

      // Create CommunityContracts Table
      await queryInterface.createTable('CommunityContracts', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        community_id: { type: Sequelize.STRING, allowNull: false, references: { model: 'Chains', key: 'id' } },
        contract_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Contracts', key: 'id' }}
      }, { transaction: t });

      // Migrate Current Chains to Contracts + CommunityContracts
      const query = `
        SELECT c.id as cid, cn.id as cnid, c.address, c.decimals, c.token_name, c.symbol, c.network 
        FROM "Chains" c 
        LEFT JOIN "ChainNodes" cn 
        ON c.chain_node_id = cn.id 
        WHERE base='ethereum' AND address LIKE '0x%';`
      const chains = await queryInterface.sequelize.query(query, { transaction: t });
      await Promise.all(chains[0].map(async (c) => {
        // create Contract and CommuntiyContract
        await queryInterface.bulkInsert('Contracts', [{
          address: c.address,
          chain_node_id: c.cnid,
          decimals: c.decimals,
          token_name: c.token_name,
          symbol: c.symbol,
          type: c.network,
        }], {transaction: t});
        console.log('2')
        const contract = await queryInterface.sequelize.query(`SELECT * FROM "Contracts" WHERE address='${c.address}';`, { transaction: t});
        if (!contract[0][0].id) console.log('null!', contract[0]);
        await queryInterface.bulkInsert('CommunityContracts', [{
          community_id: c.cid,
          contract_id: contract[0][0].id,
        }], {transaction: t });
        console.log('3');
      }));




      // Update Columns on Chains Table
      await queryInterface.renameColumn('Chains', 'symbol', 'default_symbol', { transaction: t });
      await queryInterface.changeColumn('Chains', 'default_symbol',
        { type: Sequelize.STRING, allowNull: true }, { transaction: t });
      await queryInterface.removeColumn('Chains', 'decimals', { transaction: t });
      await queryInterface.removeColumn('Chains', 'address', { transaction: t });

    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Update Chains back
      await queryInterface.changeColumn('Chains', 'default_symbol',
        { type: Sequelize.STRING, allowNull: false }, { transaction: t });
      await queryInterface.renameColumn('Chains', 'default_symbol', 'symbol', { transaction: t });
      await queryInterface.addColumn('Chains', 'decimals', { type: Sequelize.INTEGER, allowNull: true }, { transaction: t });
      await queryInterface.addColumn('Chains', 'address', { type: Sequelize.STRING, allowNull: true }, { transaction: t });

      const contracts = await queryInterface.sequelize.query(`SELECT c.decimals, c.address, cc.community_id FROM "Contracts" c LEFT JOIN "CommunityContracts" cc ON c.id = cc.contract_id;`, { transaction: t });

      await Promise.all(contracts[0].map(async (c) => {
        // Add contract stuff back on Chains model
        await queryInterface.sequelize.query(`UPDATE "Chains" c SET decimals=${c.decimals}, address='${c.address}' WHERE c.id = ${c.community_id};`, {transaction: t });
      }));


      // Delete Tables
      await queryInterface.dropTable('CommunityContracts', { transaction: t });
      await queryInterface.dropTable('Contracts', { transaction: t });
    });
  },
};
