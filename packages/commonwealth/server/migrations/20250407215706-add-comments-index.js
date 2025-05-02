'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('Reactions', ['comment_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Reactions', ['comment_id']);
  },
};
