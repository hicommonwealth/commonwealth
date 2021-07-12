'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('IdentityCaches', {
      chain: {
        type: Sequelize.STRING,
        references: {
          model: 'Chains',
          key: 'id'
        }
      },
      address: {
        type: Sequelize.STRING
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('IdentityCaches');
  }
};
