'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Addresses', 'keytype');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Addresses', 'keytype', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
