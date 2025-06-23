'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'Communities',
      'pending_namespace_judge_token_id',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'Communities',
      'pending_namespace_judge_token_id',
    );
  },
};
