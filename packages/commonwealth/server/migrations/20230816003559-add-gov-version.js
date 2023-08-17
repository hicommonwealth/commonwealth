'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Contracts', 'gov_version', {
      type: Sequelize.ENUM('alpha', 'bravo', 'oz-bravo'),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Contracts', 'gov_version');
  },
};
