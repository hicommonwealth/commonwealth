'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "Topics"
      SET name = REGEXP_REPLACE(name, '["<>%{}|\\\\/^\`?]', '', 'g')
      WHERE name ~ '[\\"<>%{}|\\\\\\/\\^\`?]';
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
