'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // add the column
      await queryInterface.addColumn(
        'ChainNodes',
        'base',
        { type: Sequelize.STRING, allowNull: true },
        { transaction }
      );

      // populate all columns
    await queryInterface.sequelize.query(`
      UPDATE "ChainNodes"
      SET base = "Chains".base
      FROM "Chains"
      WHERE "ChainNodes"."id" = "Chains"."chain_node_id";
    `, {
        raw: true, type: 'RAW', transaction
    });

      // set column to not allow null
      await queryInterface.changeColumn(
        'ChainNodes',
        'base',
        { type: Sequelize.STRING, allowNull: false },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('ChainNodes', 'base', { transaction } );
    });
  }
};
