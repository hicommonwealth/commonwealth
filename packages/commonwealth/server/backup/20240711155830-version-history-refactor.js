'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'CommentVersionHistories',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          comment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Comments', key: 'id' },
          },
          text: { type: Sequelize.TEXT, allowNull: false },
          timestamp: { type: Sequelize.DATE, allowNull: false },
        },
        {
          underscored: true,
          timestamps: false,
          indexes: [{ fields: ['comment_id'] }],
        },
        { transaction: t },
      );

      await queryInterface.createTable(
        'ThreadVersionHistories',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          thread_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Threads', key: 'id' },
          },
          address: { type: Sequelize.STRING, allowNull: false },
          body: { type: Sequelize.TEXT, allowNull: false },
          timestamp: { type: Sequelize.DATE, allowNull: false },
        },
        {
          underscored: true,
          indexes: [{ fields: ['thread_id'] }],
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Threads',
        'version_history_updated',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Comments',
        'version_history_updated',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction: t },
      );
    });
  },

  async down(queryInterface, _) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('CommentVersionHistories', {
        transaction: t,
      });
      await queryInterface.dropTable('ThreadVersionHistories', {
        transaction: t,
      });
      await queryInterface.removeColumn('Threads', 'version_history_updated', {
        transaction: t,
      });
      await queryInterface.removeColumn('Comments', 'version_history_updated', {
        transaction: t,
      });
    });
  },
};
