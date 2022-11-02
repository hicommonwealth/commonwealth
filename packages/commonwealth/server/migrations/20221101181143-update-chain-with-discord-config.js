'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Chains',
        'discord_config_id',
        {
          type: Sequelize.INTEGER,
          references: { model: 'DiscordBotConfig', key: 'id' },
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Chains', 'discord_config_id', {
          transaction: t,
        }),
      ]);
    });
  },
};
