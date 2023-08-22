'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('DiscussionDrafts')
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('DiscussionDrafts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      address_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Addresses',
          key: 'id'
        },
      },
      title: {
        type: Sequelize.TEXT
      },
      body: {
        type: Sequelize.TEXT
      },
      topic: {
        type: Sequelize.STRING(255)
      },
      chain: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  }
};
