'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Comments', 'text', 'body', {
        transaction,
      });
      await queryInterface.renameColumn(
        'CommentVersionHistories',
        'text',
        'body',
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Comments', 'body', 'text', {
        transaction,
      });
      await queryInterface.renameColumn(
        'CommentVersionHistories',
        'body',
        'text',
        { transaction },
      );
    });
  },
};
