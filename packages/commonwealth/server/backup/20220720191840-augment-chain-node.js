'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'ChainNodes',
        'balance_type',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'ChainNodes',
        'name',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'ChainNodes',
        'description',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      // populate balance_types
      // first, set everything to cosmos
      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET balance_type='cosmos';`,
        { transaction: t }
      );
      // set solana nodes
      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET balance_type='solana' WHERE url = 'devnet' OR url = 'mainnet-beta' OR url = 'testnet';`,
        { transaction: t }
      );
      // set eth nodes
      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET balance_type='ethereum' WHERE eth_chain_id IS NOT NULL;`,
        { transaction: t }
      );
      // special case for axie
      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET balance_type='terra' WHERE id = (SELECT chain_node_id FROM "Chains" WHERE "Chains".id = 'axie-infinity');`,
        { transaction: t }
      );
      // special case for terra
      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET balance_type='terra' WHERE id = (SELECT chain_node_id FROM "Chains" WHERE "Chains".id = 'terra');`,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('ChainNodes', 'balance_type', {
        transaction: t,
      });
      await queryInterface.removeColumn('ChainNodes', 'name', {
        transaction: t,
      });
      await queryInterface.removeColumn('ChainNodes', 'description', {
        transaction: t,
      });
    });
  },
};
