'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Users',
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
      await queryInterface.removeColumn('Users', 'promotional_emails_enabled', {
        transaction: t,
      });
    });
  },
};
