'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Threads', 'discord_meta', {
      type: Sequelize.JSONB,
      allowNull: true, 
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Threads', 'discordMeta');
  },
};