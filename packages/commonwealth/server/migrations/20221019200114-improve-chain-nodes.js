'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     return queryInterface.sequelize.transaction(async (t) => {

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

    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `UPDATE "ChainNodes" SET name=LTRIM(RTRIM(name));`
      );
      await queryInterface.removeColumn('ChainNodes', 'ss58');
      await queryInterface.removeColumn('ChainNodes', 'bech32');
      await queryInterface.removeColumn('ChainNodes', 'created_at');
      await queryInterface.removeColumn('ChainNodes', 'updated_at');
     });

  }
};
