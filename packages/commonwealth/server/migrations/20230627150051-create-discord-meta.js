'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Topics', 'channel_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Threads', 'discord_meta', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    await queryInterface.addColumn('Comments', 'discord_meta', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Threads', 'discord_meta');
    await queryInterface.removeColumn('Comments', 'discord_meta');
    await queryInterface.removeColumn('Topics', 'channel_id');
  },
};
