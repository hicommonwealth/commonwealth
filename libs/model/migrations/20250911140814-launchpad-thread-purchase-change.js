'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
        UPDATE "Communities" C
        SET thread_purchase_token = LT.token_address
        FROM "LaunchpadTokens" LT
        WHERE C.namespace = LT.namespace;
    `);
  },

  async down(queryInterface, Sequelize) {},
};
