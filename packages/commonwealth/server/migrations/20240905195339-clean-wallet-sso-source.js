'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "Addresses"
      SET wallet_sso_source = NULL
      WHERE wallet_sso_source = '';
    `);
  },

  async down(queryInterface, Sequelize) {},
};
