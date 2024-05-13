'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Profiles',
        'promotional_emails_enabled',
        {
          type: Sequelize.BOOLEAN,
        },
        { transaction: t },
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'Profiles',
        'promotional_emails_enabled',
        {
          transaction: t,
        },
      );
    });
  },
};
