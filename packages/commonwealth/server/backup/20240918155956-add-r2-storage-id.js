'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'ThreadVersionHistories',
        'content_url',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'CommentVersionHistories',
        'content_url',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Threads',
        'content_url',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Comments',
        'content_url',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(
        'ThreadVersionHistories',
        'content_url',
        { transaction },
      );
      await queryInterface.removeColumn(
        'CommentVersionHistories',
        'content_url',
        { transaction },
      );
      await queryInterface.removeColumn('Threads', 'content_url', {
        transaction,
      });
      await queryInterface.removeColumn('Comments', 'content_url', {
        transaction,
      });
    });
  },
};
