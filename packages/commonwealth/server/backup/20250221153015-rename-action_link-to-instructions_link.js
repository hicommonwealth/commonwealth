'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'QuestActionMetas',
      'action_link',
      'instructions_link',
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.renameColumn(
      'QuestActionMetas',
      'instructions_link',
      'action_link',
    );
  },
};
