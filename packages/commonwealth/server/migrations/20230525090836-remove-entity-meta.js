'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ChainEntityMeta');
  },

  down: async (queryInterface, Sequelize) => {
    // no-go requires cross-db query -> the table is already unused so no effect
  },
};
