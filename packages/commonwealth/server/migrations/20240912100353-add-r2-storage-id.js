'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'ThreadVersionHistories',
        'blob_storage_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'CommentVersionHistories',
        'blob_storage_id',
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
        'blob_storage_id',
        { transaction },
      );
      await queryInterface.removeColumn(
        'CommentVersionHistories',
        'blob_storage_id',
        { transaction },
      );
    });
  },
};
