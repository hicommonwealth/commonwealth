'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('IdentityCache', {
      chain: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Chains',
          key: 'id'
        }
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('IdentityCache');
  }
};
