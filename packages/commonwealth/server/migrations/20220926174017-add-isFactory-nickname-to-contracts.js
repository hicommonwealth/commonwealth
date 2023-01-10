'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('Contracts', 'is_factory', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('Contracts', 'nickname', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('ContractAbis', 'is_factory', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Contracts', 'is_factory');
    await queryInterface.removeColumn('Contracts', 'nickname');
    await queryInterface.removeColumn('ContractAbis', 'is_factory');
  },
};
