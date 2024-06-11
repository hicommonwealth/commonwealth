'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Addresses', 'name');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Addresses',
      'name',
      {
        type: Sequelize.STRING,
        allowNull: true,
      },
    );
  }
};
