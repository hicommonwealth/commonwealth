'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ChainEntities', 'queued');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ChainEntities', 'queued', {
      type: Sequelize.STRING,
      defaultValue: 0,
      allowNull: false,
    });
  },
};
