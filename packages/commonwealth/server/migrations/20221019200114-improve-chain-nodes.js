'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
     return queryInterface.sequelize.transaction(async (t) => {

      // Add Columns
      await queryInterface.addColumn('ChainNodes', 'ss58', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('ChainNodes', 'bech32', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('ChainNodes', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      }, { transaction: t });

      await queryInterface.addColumn('ChainNodes', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      }, { transaction: t });


      // Add entry names
    });
  },

  down: async (queryInterface, Sequelize) => {
     return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query( `UPDATE "ChainNodes" SET name=NULL;`, { transaction });
      await queryInterface.sequelize.query( `UPDATE "ChainNodes" SET description=NULL;`, { transaction });
      await queryInterface.removeColumn('ChainNodes', 'ss58', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'bech32', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'created_at', { transaction });
      await queryInterface.removeColumn('ChainNodes', 'updated_at', { transaction });
     });

  }
};
