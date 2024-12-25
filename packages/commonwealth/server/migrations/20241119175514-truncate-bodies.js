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
      await queryInterface.changeColumn('Comments', 'body', {
        type: Sequelize.STRING(2000),
        allowNull: false,
        transaction,
      });
      await queryInterface.changeColumn('ThreadVersionHistories', 'body', {
        type: Sequelize.STRING(2000),
        allowNull: false,
        transaction,
      });
      await queryInterface.changeColumn('CommentVersionHistories', 'body', {
        type: Sequelize.STRING(2000),
        allowNull: false,
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
      await queryInterface.changeColumn('Comments', 'body', {
        type: Sequelize.TEXT,
        transaction,
      });
      await queryInterface.changeColumn('ThreadVersionHistories', 'body', {
        type: Sequelize.TEXT,
        transaction,
      });
      await queryInterface.changeColumn('CommentVersionHistories', 'body', {
        type: Sequelize.TEXT,
        transaction,
      });
    });
  },
};
