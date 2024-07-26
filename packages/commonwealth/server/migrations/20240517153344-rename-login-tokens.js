'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('LoginTokens', 'EmailUpdateTokens', {
        transaction,
      });
      await queryInterface.removeColumn('EmailUpdateTokens', 'domain', {
        transaction,
      });
      await queryInterface.removeColumn('EmailUpdateTokens', 'used', {
        transaction,
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'EmailUpdateTokens',
        'domain',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'EmailUpdateTokens',
        'used',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        {
          transaction,
        },
      );
      await queryInterface.renameTable('EmailUpdateTokens', 'LoginTokens', {
        transaction,
      });
    });
  },
};
