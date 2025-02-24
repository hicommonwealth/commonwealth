'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Addresses',
        'oauth_provider',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Addresses',
        'oauth_email',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Addresses',
        'oauth_username',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Addresses', 'oauth_provider', {
        transaction,
      });
      await queryInterface.removeColumn('Addresses', 'oauth_email', {
        transaction,
      });
      await queryInterface.removeColumn('Addresses', 'oauth_username', {
        transaction,
      });
    });
  },
};
