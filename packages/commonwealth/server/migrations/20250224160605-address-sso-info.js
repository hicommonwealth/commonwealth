'use strict';

const Sequelize = require('sequelize');
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
      await queryInterface.addColumn(
        'Addresses',
        'oauth_phone_number',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Addresses',
        'oauth_email_verified',
        { type: Sequelize.BOOLEAN, allowNull: true },
        { transaction },
      );

      await queryInterface.removeIndex('Users', ['email'], {
        transaction,
      });
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
      await queryInterface.removeColumn('Addresses', 'oauth_phone_number', {
        transaction,
      });
      await queryInterface.removeColumn('Addresses', 'oauth_email_verified', {
        transaction,
      });
      await queryInterface.addIndex('Users', ['email'], {
        unique: true,
        transaction,
      });
    });
  },
};
