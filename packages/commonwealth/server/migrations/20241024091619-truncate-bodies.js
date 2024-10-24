'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn('Threads', 'body', {
        type: Sequelize.STRING(2000),
        allowNull: false,
        transaction,
      });
      await queryInterface.changeColumn('Comments', 'text', {
        type: Sequelize.STRING(2000),
        transaction,
      });
      await queryInterface.changeColumn('ThreadVersionHistories', 'body', {
        type: Sequelize.STRING(2000),
        transaction,
      });
      await queryInterface.changeColumn('CommentVersionHistories', 'text', {
        type: Sequelize.STRING(2000),
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn('Threads', 'body', {
        type: Sequelize.TEXT,
        allowNull: true,
        transaction,
      });
      await queryInterface.changeColumn('Comments', 'text', {
        type: Sequelize.TEXT,
        transaction,
      });
      await queryInterface.changeColumn('ThreadVersionHistories', 'body', {
        type: Sequelize.TEXT,
        transaction,
      });
      await queryInterface.changeColumn('CommentVersionHistories', 'text', {
        type: Sequelize.TEXT,
        transaction,
      });
    });
  },
};
