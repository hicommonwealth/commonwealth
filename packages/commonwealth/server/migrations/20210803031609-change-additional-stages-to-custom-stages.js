'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn(
        'Chains',
        'additionalStages',
        'customStages'
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'additionalStages',
        'customStages'
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn(
        'Chains',
        'customStages',
        'additionalStages'
      );
      await queryInterface.renameColumn(
        'OffchainCommunities',
        'customStages',
        'additionalStages'
      );
    });
  },
};
