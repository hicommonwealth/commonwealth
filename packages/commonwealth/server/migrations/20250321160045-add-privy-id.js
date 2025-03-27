'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Users', 'privy_id', {
        type: Sequelize.STRING,
        allowNull: true,
      });
      // TODO: need to check query plans
      await queryInterface.addIndex('Users', ['privy_id'], {
        transaction,
        unique: true,
      });
      await queryInterface.addIndex('Addresses', ['oauth_provider'], {
        transaction,
      });
      await queryInterface.addIndex('Addresses', ['oauth_email'], {
        transaction,
      });
      await queryInterface.addIndex('Addresses', ['oauth_username'], {
        transaction,
      });
      await queryInterface.addIndex('Addresses', ['oauth_phone_number'], {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'privy_id');
  },
};
