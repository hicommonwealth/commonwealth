'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // add nickname column to ContractAbis table
    await queryInterface.addColumn('ContractAbis', 'nickname', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // remove nickname column from contractAbis table
    await queryInterface.removeColumn('contractAbis', 'nickname');
  },
};
