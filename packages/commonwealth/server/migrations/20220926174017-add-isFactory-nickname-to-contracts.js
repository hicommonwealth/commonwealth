'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('Contracts', 'isFactory', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: 'false',
    });

    await queryInterface.addColumn('Contracts', 'nickname', {
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
    await queryInterface.removeColumn('Contracts', 'isFactory');
    await queryInterface.removeColumn('Contracts', 'nickname');
  }
};
