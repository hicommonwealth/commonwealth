'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "Users" U
      SET tier = 7
      FROM "Addresses" as A
      WHERE A.user_id = U.id
        AND A.address = '0xdiscordbot'
        AND U.email = 'discord@common.xyz'
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
