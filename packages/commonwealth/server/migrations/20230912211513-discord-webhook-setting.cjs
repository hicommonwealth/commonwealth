'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Chains', 'discord_bot_webhooks_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'Chains',
      'discord_bot_webhooks_enabled'
    );
  },
};
