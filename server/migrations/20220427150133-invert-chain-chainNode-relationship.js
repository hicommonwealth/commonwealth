module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // add new rows to Chains
      await queryInterface.addColumn('Chains', 'chain_node_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'ChainNodes', key: 'id' }
      }, { transaction });
      await queryInterface.addColumn('Chains', 'address', {
          type: Sequelize.STRING,
          allowNull: true
      }, { transaction });
      await queryInterface.addColumn('Chains', 'token_name', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
      await queryInterface.addColumn('Chains', 'ce_verbose', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }, { transaction });

      // clone id / addresses / verbose / token_name over to associated Chain
      await queryInterface.sequelize.query(`
        UPDATE "Chains"
        SET
          chain_node_id = "ChainNodes".id,
          address = "ChainNodes".address,
          token_name = "ChainNodes".token_name,
          ce_verbose = "ChainNodes".ce_verbose
        FROM "ChainNodes"
        WHERE "Chains".id = "ChainNodes".chain;
      `, {
        raw: true, type: 'RAW', transaction, logging: console.log
      });

      // remove duplicated rows from ChainNodes
      await queryInterface.removeColumn('ChainNodes', 'ce_verbose', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'token_name', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'address', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'chain', { transaction });

      // update ids to reference single nodes
      // TODO: fix this query
      await queryInterface.sequelize.query(`
        WITH cid AS (
          SELECT MIN(id)
          FROM "ChainNodes"
          WHERE url = (
            SELECT url
            FROM "ChainNodes" n
            WHERE "Chains".chain_node_id = n.id
          )
        )
        UPDATE "Chains"
        SET chain_node_id = cid;
      `, {
        raw: true, type: 'RAW', transaction, logging: console.log
      });

      // deduplicate ChainNodes + modify chain_node_ids
      // TODO: validate this query works
      await queryInterface.sequelize.query(`
        DELETE FROM "ChainNodes" c
        WHERE c.id <> (SELECT MIN(id)
                       FROM "ChainNodes" n
                       WHERE c.url = n.url);
      `, {
        raw: true, type: 'RAW', transaction, logging: console.log
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // re-add old rows to ChainNodes
      await queryInterface.addColumn('ChainNodes', 'chain', {
        type: Sequelize.STRING,
        allowNull: true,
        references: { model: 'Chains', key: 'id' },
      }, { transaction });
      await queryInterface.addColumn('ChainNodes', 'address', {
          type: Sequelize.STRING,
          allowNull: true
      }, { transaction });
      await queryInterface.addColumn('ChainNodes', 'token_name', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
      await queryInterface.addColumn('ChainNodes', 'ce_verbose', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      }, { transaction });

      // TODO: create duplicates of chain nodes for each chain, and populate 'chain' column
      // TODO: disable allowNull for chain nodes
      // TODO: clone addresses / verbose / token_name over to associated chain node

      await queryInterface.removeColumn('Chains', 'ce_verbose', { transaction });
      await queryInterface.removeColumn('Chains', 'token_name', { transaction });
      await queryInterface.removeColumn('Chains', 'address', { transaction });
      await queryInterface.removeColumn('Chains', 'chain_node_id', { transaction });
    });
  }
};
