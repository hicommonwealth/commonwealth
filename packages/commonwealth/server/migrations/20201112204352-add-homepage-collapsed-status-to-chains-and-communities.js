'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('Chains', 'collapsed_on_homepage', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
      await queryInterface.addColumn(
        'OffchainCommunities',
        'collapsed_on_homepage',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Chains', 'collapsed_on_homepage');
      await queryInterface.removeColumn(
        'OffchainCommunities',
        'collapsed_on_homepage'
      );
    });
  },
};
