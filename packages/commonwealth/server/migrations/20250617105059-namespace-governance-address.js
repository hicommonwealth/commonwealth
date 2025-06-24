'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Communities',
      'namespace_governance_address',
      {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'namespace_governance_address');
  },
};
