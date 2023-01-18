module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // migrate selectedNodeId to corresponding ChainId on Users
      await queryInterface.addColumn(
        'Users',
        'selected_chain_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
          references: {
            model: 'Chains',
            key: 'id',
          },
        },
        { transaction }
      );
      await queryInterface.sequelize.query(
        `
				UPDATE "Users"
				SET selected_chain_id = "ChainNodes".chain
				FROM "ChainNodes"
				WHERE "Users"."selectedNodeId" = "ChainNodes".id;
			`,
        {
          raw: true,
          type: 'RAW',
          transaction,
          logging: console.log,
        }
      );
      await queryInterface.removeColumn('Users', 'selectedNodeId', {
        transaction,
      });

      // add new rows to Chains
      await queryInterface.addColumn(
        'Chains',
        'chain_node_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'Chains',
        'address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'Chains',
        'token_name',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'Chains',
        'ce_verbose',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction }
      );

      // clone id / addresses / verbose / token_name over to associated Chain
      await queryInterface.sequelize.query(
        `
				UPDATE "Chains"
				SET
				chain_node_id = "ChainNodes".id,
				address = "ChainNodes".address,
				token_name = "ChainNodes".token_name,
				ce_verbose = "ChainNodes".ce_verbose
				FROM "ChainNodes"
				WHERE "Chains".id = "ChainNodes".chain;
			`,
        {
          raw: true,
          type: 'RAW',
          transaction,
          logging: console.log,
        }
      );

      // set up cleaned and deduped ChainNodes values
      await queryInterface.sequelize.query(
        `
				SELECT ROW_NUMBER() OVER (ORDER BY a.url) AS id, a.*
				INTO "tmp_ChainNodes"
				FROM (SELECT DISTINCT 
						cn.url, 
						CASE WHEN cn.url = 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_'
								THEN 'https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_'
							WHEN cn.url = 'https://rpc-juno.itastakers.com'
								THEN 'https://lcd-juno.itastakers.com'
							ELSE cn.alt_wallet_url
						END AS alt_wallet_url, 
						CASE WHEN cn.url = 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_'
							THEN 1 ELSE NULL
						END AS eth_chain_id, 
						CASE WHEN cn.url = 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_'
								THEN (SELECT max(private_url) AS private_url  FROM "ChainNodes" cn WHERE eth_chain_id = 1)
								ELSE cn.private_url 
						END AS private_url
						FROM "ChainNodes" cn
					) a; 
			`,
        {
          raw: true,
          type: 'RAW',
          transaction,
          logging: console.log,
        }
      );

      // map new ChainNodeID to Chains
      await queryInterface.sequelize.query(
        `
					UPDATE "Chains" 
						SET chain_node_id = tcn.id
					FROM "ChainNodes" cn
						INNER JOIN "tmp_ChainNodes" tcn ON cn.url = tcn.url
					WHERE "Chains".id = cn."chain";  
				`,
        {
          raw: true,
          type: 'RAW',
          transaction,
          logging: console.log,
        }
      );

      /*
			// disable fkey in Users
			await queryInterface.sequelize.query(`
					ALTER TABLE "Users"
						DROP CONSTRAINT "Users_selected_node_id_fkey";
				`, {
				raw: true, type: 'RAW', transaction, logging: console.log
			});

			// map new ChainNodeID to Users
			await queryInterface.sequelize.query(`
					UPDATE "Users"
						SET "selectedNodeId" = tcn.id
					FROM "ChainNodes" cn
						INNER JOIN "tmp_ChainNodes" tcn ON cn.url = tcn.url
					WHERE "Users"."selectedNodeId" = cn.id;
				`, {
				raw: true, type: 'RAW', transaction, logging: console.log
			});
			*/

      // remove duplicated rows from ChainNodes
      await queryInterface.removeColumn('ChainNodes', 'ce_verbose', {
        transaction,
      });
      await queryInterface.removeColumn('ChainNodes', 'token_name', {
        transaction,
      });
      await queryInterface.removeColumn('ChainNodes', 'address', {
        transaction,
      });
      await queryInterface.removeColumn('ChainNodes', 'chain', { transaction });

      // clear old ChainNodes values
      await queryInterface.sequelize.query(
        `
				TRUNCATE TABLE "ChainNodes";
			`,
        {
          raw: true,
          type: 'RAW',
          transaction,
          logging: console.log,
        }
      );

      // insert new ChainNodes values
      await queryInterface.sequelize.query(
        `
				INSERT INTO "ChainNodes" (id, url, alt_wallet_url, eth_chain_id, private_url)
				SELECT id, url, alt_wallet_url, eth_chain_id, private_url
					FROM "tmp_ChainNodes";
			`,
        {
          raw: true,
          type: 'RAW',
          transaction,
          logging: console.log,
        }
      );

      /*
			// restore fkey in Users
			await queryInterface.sequelize.query(`
					ALTER TABLE "Users"
						ADD CONSTRAINT "Users_selected_node_id_fkey"
						FOREIGN KEY ("selectedNodeId") REFERENCES "ChainNodes"(id)
						ON UPDATE CASCADE ON DELETE SET NULL;
				`, {
				raw: true, type: 'RAW', transaction, logging: console.log
			});
			*/

      // drop temp table
      await queryInterface.sequelize.query(
        `
				DROP TABLE "tmp_ChainNodes";
			`,
        {
          raw: true,
          type: 'RAW',
          transaction,
          logging: console.log,
        }
      );

      // set the foreign key relationship now, to avoid errors during loading
      await queryInterface.changeColumn(
        'Chains',
        'chain_node_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'ChainNodes', key: 'id' },
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // re-add old rows to ChainNodes
      await queryInterface.addColumn(
        'ChainNodes',
        'chain',
        {
          type: Sequelize.STRING,
          allowNull: true,
          references: { model: 'Chains', key: 'id' },
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'ChainNodes',
        'address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'ChainNodes',
        'token_name',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'ChainNodes',
        'ce_verbose',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction }
      );

      // TODO: create duplicates of chain nodes for each chain, and populate 'chain' column
      // TODO: disable allowNull for chain nodes (have to clean up the two records w/no nodes first)
      // TODO: clone addresses / verbose / token_name over to associated chain node

      await queryInterface.removeColumn('Chains', 'ce_verbose', {
        transaction,
      });
      await queryInterface.removeColumn('Chains', 'token_name', {
        transaction,
      });
      await queryInterface.removeColumn('Chains', 'address', { transaction });
      await queryInterface.removeColumn('Chains', 'chain_node_id', {
        transaction,
      });
    });
  },
};
