'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Chains',
        'active',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Users',
        'emailVerified',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Chains', 'active', { transaction: t });
      await queryInterface.removeColumn('Users', 'emailVerified', {
        transaction: t,
      });
    });
  },
};
