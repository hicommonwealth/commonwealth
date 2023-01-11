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
      await queryInterface.addColumn(
        'ContractAbis',
        'create_dao_function_name',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'ContractAbis',
        'create_dao_event_name',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'ContractAbis',
        'create_dao_event_parameter',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
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
      await queryInterface.removeColumn('ContractAbis', 'create_dao_function', {
        transaction: t,
      });
      await queryInterface.removeColumn('ContractAbis', 'create_dao_event', {
        transaction: t,
      });
      await queryInterface.removeColumn('ContractAbis', 'dao_event_arg_name', {
        transaction: t,
      });
    });
  },
};
