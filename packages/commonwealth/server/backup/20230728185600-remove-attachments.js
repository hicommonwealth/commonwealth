'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('DiscussionDrafts', 'attachment', {
        transaction,
      });
      await queryInterface.dropTable('Attachments', { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'Attachments',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          attachable: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          attachment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          url: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'DiscussionDrafts',
        'attachment',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Attachments', key: 'id' },
        },
        { transaction }
      );
    });
  },
};
