'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Addresses', 'wallet_sso_source');
  },

  async down(queryInterface, Sequelize) {},
};
