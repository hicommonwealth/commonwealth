'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('Communities', ['namespace_address'], {
      name: 'communities_namespace_address_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      'Communities',
      'communities_namespace_address_idx',
    );
  },
};
